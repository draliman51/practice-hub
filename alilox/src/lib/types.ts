export type Role = 'child' | 'parent' | 'admin';
export type Status = 'pending' | 'active' | 'frozen' | 'banned';
export interface Avatar { skin: number; shirt: number; pants: number; hair: string; hairc: number; face: string; hat: string; back: string; pet: string }
export interface Profile {
  id: string; username: string; display_name: string; role: Role; status: Status; parent_id: string | null; parent_email: string | null; under13: boolean;
  friend_code: string; avatar: Avatar; photo_path: string | null; photo_approved: boolean; coins: number; xp: number; level: number; streak: number; last_gift: string | null;
  lang: 'ar' | 'en'; daily_limit_min: number; allowed_from: number; allowed_to: number; house: { wall: number; floor: number; items: { id: string; x: number; y: number; r?: number }[] };
  owned: string[]; badges: string[]; worlds_done: string[]; created_at: string; last_seen: string | null;
}
export interface Player { id: string; username: string; display_name: string; role: Role; status: Status; avatar: Avatar; level: number; xp: number; badges: string[]; friend_code: string; last_seen: string | null; photo_path: string | null; under13: boolean }
export interface Item { id: string; kind: string; name_en: string; name_ar: string; icon: string; price: number; rarity: string; season: string | null; active: boolean; sort: number }
export interface Quest { id: string; period: 'daily' | 'weekly'; kind: string; target: number; title_en: string; title_ar: string; reward_coins: number; reward_xp: number; icon: string; active: boolean }
export interface Season { id: string; name_en: string; name_ar: string; icon: string; theme: { sky?: string; accent?: string; snow?: boolean }; starts_at: string; ends_at: string; active: boolean }
export const XP_FOR_LEVEL = (lvl: number) => Math.round(100 * Math.pow(lvl - 1, 1.5));
export interface AliloxEvent { id: string; title: string; message: string; icon: string; world: string; starts_at: string; ends_at: string; reward_coins: number; badge: string | null; active: boolean }
