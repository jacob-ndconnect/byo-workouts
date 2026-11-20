import { nowIso } from "@/core/time";
import { createMemoryRepository } from "@/data/adapters/memory";
import type { Repository } from "@/data/repository";

let repository: Repository | null = null;

/** Web and other non-native platforms use the in-memory adapter. */
export function openRepository(): Repository {
  if (!repository) {
    repository = createMemoryRepository({ now: nowIso });
  }
  return repository;
}