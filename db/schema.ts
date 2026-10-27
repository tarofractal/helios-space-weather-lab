import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const notes = sqliteTable('research_notes', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),
 body:text('body').notNull(),tags:text('tags').notNull().default(''),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
});
export const feedCache=sqliteTable('feed_cache',{
 id:text('id').primaryKey(),payload:text('payload').notNull(),fetchedAt:text('fetched_at').notNull(),
});
