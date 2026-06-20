-- Sell It Notification Center V1
-- Run this once in Supabase SQL Editor before testing Notification Center V1.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  recipient_user_id uuid null,
  notification_type text not null check (
    notification_type in (
      'Task Due Today',
      'Task Overdue',
      'Task Assigned',
      'Opportunity Stage Changed',
      'New Email Intelligence Saved',
      'New Pain Point Created',
      'Merge Completed'
    )
  ),
  message text not null,
  related_record_type text null,
  related_record_id uuid null,
  related_url text null,
  is_read boolean not null default false,
  read_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_workspace_created_idx
  on public.notifications (workspace_id, created_at desc);

create index if not exists notifications_workspace_unread_idx
  on public.notifications (workspace_id, is_read, created_at desc);

create index if not exists notifications_related_record_idx
  on public.notifications (related_record_type, related_record_id);

comment on table public.notifications is
  'In-app notifications for Sell It Notification Center V1. No background jobs, email, SMS, push, or browser notifications.';
