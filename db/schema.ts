import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name"),

    email: text("email").notNull().unique(),

    role: roleEnum("role"),

    password: text("password"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  }),
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "no action" }),
  role: roleEnum("role"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const client = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  deal_value: integer("deal_value"),
  stage: text("stage").default("LEAD"),
  notes: text(""),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  creator_name: text("creator_name"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

// exp

//   "posts",
//   {
//     id: serial("id").primaryKey(),

//     userId: uuid("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),

//     title: text("title").notNull(),

//     content: text("content"),

//     published: boolean("published").notNull().default(false),

//     createdAt: timestamp("created_at", { withTimezone: true })
//       .notNull()
//       .defaultNow(),
//   },
//   (table) => ({
//     userCreatedIdx: index("posts_user_created_idx").on(
//       table.userId,
//       table.createdAt,
//     ),
//     createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
//   }),
// );
