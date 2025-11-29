-- Migration number: 0004 	 2025-11-29T00:00:00.000Z
ALTER TABLE Minuts ADD COLUMN summary TEXT;
ALTER TABLE Minuts ADD COLUMN transcript TEXT;
