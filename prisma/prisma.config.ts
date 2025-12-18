// Prisma 7 Configuration
// This file configures the database connection for Prisma Migrate
// See: https://pris.ly/d/config-datasource

import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
})
