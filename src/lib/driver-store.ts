"use client";
import { create } from "zustand";

type DriverState = {
  token: string;
  phone: string;
  name: string;
  hydrate: () => void;
  set: (p: Partial<Omit<DriverState, "hydrate" | "logout">>) => void;
  logout: () => void;
};

export const useDriver = create<DriverState>((set) => ({
  token: "",
  phone: "",
  name: "",
  hydrate: () =>
    set({
      token: localStorage.getItem("pr_token") || "",
      phone: localStorage.getItem("pr_phone") || "",
      name: localStorage.getItem("pr_name") || "",
    }),
  set: (p) => {
    if (p.token !== undefined) localStorage.setItem("pr_token", p.token);
    if (p.phone !== undefined) localStorage.setItem("pr_phone", p.phone);
    if (p.name !== undefined) localStorage.setItem("pr_name", p.name);
    set(p);
  },
  logout: () => {
    localStorage.removeItem("pr_token");
    localStorage.removeItem("pr_phone");
    localStorage.removeItem("pr_name");
    set({ token: "", phone: "", name: "" });
  },
}));
