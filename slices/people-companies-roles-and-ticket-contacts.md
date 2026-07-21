# Slice: People, Companies, Roles, and Ticket Contacts

## Goal

Create a simple structure for people and companies that avoids duplicate records and lets the same person serve different roles on different job tickets.

## Core Decisions

The system will maintain separate records for:

- Companies
- People
- Saved roles
- Ticket-specific contact assignments

Saved roles help organize and filter people. They do not restrict who can