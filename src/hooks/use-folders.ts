import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Folder, Collection } from "@/lib/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://fileforge1.pythonanywhere.com";

function getApiKey(): string {
  return localStorage.getItem("ff_access") || "";
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Folder hooks
// ---------------------------------------------------------------------------

export function useFolders(provider: string = "cloudinary", path: string = "") {
  return useQuery({
    queryKey: ["folders", provider, path],
    queryFn: async () => {
      const params = new URLSearchParams({ provider });
      if (path) params.set("path", path);
      const res = await fetch(`${BASE_URL}/api/folders/?${params}`, {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch folders");
      const data = await res.json();
      return data.folders as Folder[];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ provider, path }: { provider: string; path: string }) => {
      const res = await fetch(`${BASE_URL}/api/folders/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ provider, path }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json() as Promise<Folder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ provider, path }: { provider: string; path: string }) => {
      const params = new URLSearchParams({ provider });
      const res = await fetch(`${BASE_URL}/api/folders/${encodeURIComponent(path)}/?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getApiKey()}` },
      });
      if (!res.ok) throw new Error("Failed to delete folder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Collection hooks
// ---------------------------------------------------------------------------

export function useCollections(provider: string = "cloudinary") {
  return useQuery({
    queryKey: ["collections", provider],
    queryFn: async () => {
      const params = new URLSearchParams({ provider });
      const res = await fetch(`${BASE_URL}/api/collections/?${params}`, {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch collections");
      const data = await res.json();
      return data.collections as Collection[];
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      provider,
      name,
      description,
    }: {
      provider: string;
      name: string;
      description?: string;
    }) => {
      const res = await fetch(`${BASE_URL}/api/collections/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ provider, name, description }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      return res.json() as Promise<Collection>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      provider,
      collectionId,
      fileIds,
    }: {
      provider: string;
      collectionId: string;
      fileIds: string[];
    }) => {
      const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/assets/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ provider, file_ids: fileIds }),
      });
      if (!res.ok) throw new Error("Failed to add to collection");
      return res.json() as Promise<Collection>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      provider,
      collectionId,
      fileIds,
    }: {
      provider: string;
      collectionId: string;
      fileIds: string[];
    }) => {
      const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/assets/`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ provider, file_ids: fileIds }),
      });
      if (!res.ok) throw new Error("Failed to remove from collection");
      return res.json() as Promise<Collection>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
