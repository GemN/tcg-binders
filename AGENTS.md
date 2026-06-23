# Guidelines for LLM-based Agents

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


# DATABASE CONVENTIONS

# Conventions used in this database schema:

### Naming

- snake_case for tables, functions, columns (avoids having to put them in quotes
  in most cases)
- plural table names (avoids conflicts with e.g. `user` built ins, is better
  depluralized by PostGraphile)
- trigger functions valid for one table only are named
  tg\_[table_name]\_\_[task_name]
- trigger functions valid for many tables are named tg\_\_[task_name]
- trigger names should be prefixed with `_NNN_` where NNN is a three digit
  number that defines the priority of the trigger (use _500_ if unsure)
- prefer lowercase over UPPERCASE, except for the `NEW`, `OLD` and `TG_OP`
  keywords. (This is Benjie's personal preference.)

### Security

- all `security definer` functions should define `set search_path from current`
  due to `CVE-2018-1058`
- all tables (public or not) should enable RLS
- relevant RLS policy should be defined before granting a permission
- `grant select` should never specify a column list; instead use one-to-one
  relations as permission boundaries
- `grant insert` and `grant update` must ALWAYS specify a column list

### Explicitness

- all functions should explicitly state immutable/stable/volatile
- do not override search_path during migrations or in server code - prefer to
  explicitly list schemas

### Functions

- if a function can be expressed as a single SQL statement it should use the
  `sql` language if possible. Other functions should use `plpgsql`.
- be aware of the function inlining rules:
  https://wiki.postgresql.org/wiki/Inlining_of_SQL_functions

### Relations

- all foreign key `references` statements should have `on delete` clauses. Some
  may also want `on update` clauses, but that's optional
- all comments should be defined using '"escape" string constants' - e.g.
  `E'...'` - because this more easily allows adding special characters such as
  newlines
- defining things (primary key, checks, unique constraints, etc) within the
  `create table` statement is preferable to adding them after

### General conventions (e.g. for PostGraphile compatibility)

- avoid `plv8` and other extensions that aren't built in because they can be
  complex for people to install
- @omit smart comments should be used heavily to remove fields we don't
  currently need in GraphQL - we can always remove them later

### Definitions

Please adhere to the following templates (respecting newlines):

Tables:

```sql
create table <schema_name>.<table_name> (
  ...
);
```

SQL functions:

```sql
create function <fn_name>(<args...>) returns <return_value> as $$
  select ...
  from ...
  inner join ...
  on ...
  where ...
  and ...
  order by ...
  limit ...;
$$ language sql <strict?> <immutable|stable|volatile> <security definer?> set search_path from current;
```

PL/pgSQL functions:

```sql
create function <fn_name>(<args...>) returns <return_value> as $$
declare
  v_[varname] <type>[ = <default>];
  ...
begin
  if ... then
    ...
  end if;
  return <value>;
end;
$$ language plpgsql <strict?> <immutable|stable|volatile> <security definer?> set search_path from current;
```

Triggers:

```sql
create trigger _NNN_trigger_name
  <before|after> <insert|update|delete> on <schema_name>.<table_name>
  for each row [when (<condition>)]
  execute procedure <schema_name.function_name>(...);
```

Comments:

```sql
comment on <table|column|function|...> <fully.qualified.name> is
  E'...';
```

## Project

Do not create sql/pgsql code without my acknowledgement.
If needed only use current.sql for new sql code.

Must use i18n. Languages are English / Thai
Design is mobile-first.
Always check if the project is not already up before running it.
Always use types from @app/graphql whenever possible
Get data from the backend thanks to graphql queries and mutation.
