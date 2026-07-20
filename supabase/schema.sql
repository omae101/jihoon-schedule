-- 한번에: 엄마폰 ↔ 자녀폰 가족 연동 스키마
-- 사용법: Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 RUN.
-- 사전: Authentication > Providers 에서 "Anonymous sign-ins" 를 켜야 함(가입 없이 기기 연결).
-- 보안 원칙: 가족공간 멤버만 자기 공간 데이터에 접근. (예전 생기부앱의 using(true) 구멍 반복 금지)

-- 0) 암호학적 난수(gen_random_bytes)용 확장 — 연결 코드 생성에 사용
create extension if not exists pgcrypto;

-- 1) 가족 공간 (엄마+자녀 한 묶음)
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- 2) 공간 멤버: 각 폰 = 익명 유저 1명
create table if not exists public.space_members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id  uuid not null references auth.users(id)  on delete cascade,
  role  text not null default 'member' check (role in ('owner','member')),
  label text,                          -- '엄마' / '지훈' 등 표시용
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index if not exists idx_members_user on public.space_members(user_id);

-- 3) 연결 코드: 6자리, 15분 만료, 1회용
create table if not exists public.pair_codes (
  code text primary key,
  space_id   uuid not null references public.spaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used boolean not null default false
);

-- 4) 데이터 저장소: localStorage 미러 (자녀 슬롯별 key/value)
create table if not exists public.kv (
  space_id uuid not null references public.spaces(id) on delete cascade,
  slot text not null default 'c1',     -- 자녀 슬롯(profiles.js의 c1/c2…)
  k text not null,                     -- 예: todo_2026-06-17
  v jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (space_id, slot, k)
);
create index if not exists idx_kv_space on public.kv(space_id);

-- RLS 켜기
alter table public.spaces        enable row level security;
alter table public.space_members enable row level security;
alter table public.pair_codes    enable row level security;
alter table public.kv            enable row level security;

-- 현재 유저가 그 공간 멤버인지 (SECURITY DEFINER = RLS 재귀 방지)
create or replace function public.is_member(p_space uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.space_members m
                where m.space_id = p_space and m.user_id = auth.uid());
$$;

-- spaces: 멤버만 조회 / 로그인 유저는 자기 공간 생성
drop policy if exists spaces_select on public.spaces;
drop policy if exists spaces_insert on public.spaces;
create policy spaces_select on public.spaces for select using (public.is_member(id));
create policy spaces_insert on public.spaces for insert with check (auth.uid() is not null);

-- space_members: 같은 공간끼리 조회 / 본인 행만 추가·삭제
drop policy if exists members_select on public.space_members;
drop policy if exists members_insert_self on public.space_members;
drop policy if exists members_delete_self on public.space_members;
create policy members_select on public.space_members for select using (public.is_member(space_id));
-- (보안) 직접 INSERT 정책 제거: 멤버 추가는 create_space_with_code/join_space RPC(SECURITY DEFINER)로만 → 코드 없이 남의 space 무단 가입 차단
create policy members_delete_self on public.space_members for delete using (user_id = auth.uid());

-- pair_codes: 멤버만 생성. 직접 SELECT 정책 없음 = 아무도 코드 목록 못 읽음(join_space RPC로만 사용)
drop policy if exists codes_insert on public.pair_codes;
create policy codes_insert on public.pair_codes for insert with check (public.is_member(space_id));

-- kv: 공간 멤버만 읽기/쓰기
drop policy if exists kv_select on public.kv;
drop policy if exists kv_write  on public.kv;
create policy kv_select on public.kv for select using (public.is_member(space_id));
create policy kv_write  on public.kv for all   using (public.is_member(space_id)) with check (public.is_member(space_id));

-- 자녀 폰: 공간 생성 + 6자리 코드 발급
create or replace function public.create_space_with_code()
returns json language plpgsql security definer set search_path = public as $$
declare v_space uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  insert into public.spaces default values returning id into v_space;
  insert into public.space_members(space_id, user_id, role, label) values (v_space, auth.uid(), 'owner', '자녀');
  v_code := public.gen_pair_code();
  insert into public.pair_codes(code, space_id, created_by, expires_at)
    values (v_code, v_space, auth.uid(), now() + interval '15 minutes');
  return json_build_object('space_id', v_space, 'code', v_code);
end; $$;

-- 연결 코드 생성: 암호학적 난수(gen_random_bytes)로 8자리 영숫자.
-- 헷갈리는 글자(0,O,1,I,L) 제외한 31자 알파벳 → 약 8.5×10^11 경우의 수.
-- (예전 6자리 숫자=100만은 익명로그인+무차별 대입에 취약 → 사실상 추측 불가로 강화)
-- search_path에 extensions 포함: Supabase는 pgcrypto(gen_random_bytes)를 extensions 스키마에 설치함
create or replace function public.gen_pair_code()
returns text language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 31), 1), '')
  from (select gen_random_bytes(8) as b) s, generate_series(0, 7) as i;
$$;

-- 엄마 폰: 코드로 공간 참여 (입력 대소문자·공백 정규화)
create or replace function public.join_space(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare v_space uuid;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  select space_id into v_space from public.pair_codes
    where code = upper(trim(p_code)) and used = false and expires_at > now();
  if v_space is null then raise exception 'invalid_or_expired'; end if;
  insert into public.space_members(space_id, user_id, role, label)
    values (v_space, auth.uid(), 'member', '엄마') on conflict do nothing;
  update public.pair_codes set used = true where code = upper(trim(p_code));
  return json_build_object('space_id', v_space);
end; $$;

-- 실시간 반영(kv 변경 푸시)을 위해 Realtime publication 에 kv 추가
-- (재실행해도 안전: 이미 추가돼 있으면 조용히 넘어감)
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;
