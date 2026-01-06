// Prisma 7 Configuration
// This file configures the database connection for Prisma Migrate
// See: https://pris.ly/d/config-datasource

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})

