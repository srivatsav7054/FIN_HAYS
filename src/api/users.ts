import type { UserProfile } from "@/types";
import { USE_MOCKS, request } from "./client";
import { mockGetUserProfile, mockPostUserProfile } from "@/mocks/data";

export function getUserProfile(userId: string): Promise<UserProfile> {
  if (USE_MOCKS) return mockGetUserProfile(userId);
  return request<UserProfile>(`/user/${userId}/profile`);
}

export function postUserProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
  if (USE_MOCKS) return mockPostUserProfile(userId, profile);
  return request<UserProfile>(`/user/${userId}/profile`, { method: "POST", body: JSON.stringify(profile) });
}
