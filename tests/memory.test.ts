import { createMemoryRepository } from "@/data/adapters/memory";

import { registerRepositoryContract } from "./repository.contract";

registerRepositoryContract((clock) => createMemoryRepository(clock));
