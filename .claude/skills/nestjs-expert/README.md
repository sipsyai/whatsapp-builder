# NestJS Expert Agent Skill

A comprehensive Agent Skill for expert NestJS development assistance, covering project setup, architecture design, component creation, database integration, authentication, microservices, GraphQL, testing, and best practices.

## Overview

This skill provides production-ready code generation and expert guidance for building NestJS applications. It follows all Agent Skills best practices including progressive disclosure, high degree of freedom, and concise instructions.

## Features

### Core Capabilities
- **Project Setup & Architecture** - Recommend optimal project structure and design patterns
- **Component Generation** - Create controllers, services, modules, guards, interceptors, pipes with proper TypeScript types
- **Database Integration** - TypeORM, Prisma, and Mongoose patterns with migrations and queries
- **Authentication & Authorization** - JWT, Passport strategies, role-based access control
- **Microservices** - TCP, Redis, RabbitMQ, Kafka, and gRPC transport layers
- **GraphQL** - Code-first and schema-first approaches with resolvers, subscriptions
- **WebSockets** - Real-time communication with Socket.IO
- **Caching** - Redis and in-memory caching strategies
- **Task Scheduling** - Cron jobs and scheduled tasks
- **Background Jobs** - Bull queues for asynchronous processing
- **Testing** - Unit and E2E test patterns
- **Best Practices** - Security, performance, error handling, and architecture guidance

### Progressive Disclosure

The skill uses progressive disclosure to optimize token usage:

**Main File (`SKILL.md`)**:
- Core responsibilities and quick start patterns
- Essential code examples for common tasks
- Basic architecture and best practices
- References to detailed topic files

**Reference Files**:
- `database-typeorm.md` - TypeORM entities, relationships, migrations, transactions
- `database-prisma.md` - Prisma schema, queries, migrations, middleware
- `database-mongoose.md` - Mongoose schemas, queries, aggregation, middleware
- `microservices.md` - All transport layers, patterns, and distributed systems
- `graphql.md` - GraphQL setup, resolvers, subscriptions, authentication
- `websockets.md` - WebSocket gateways, rooms, authentication, real-time features
- `caching.md` - Cache strategies, Redis integration, distributed caching
- `scheduling.md` - Cron jobs, intervals, timeouts, distributed scheduling
- `queues.md` - Bull queues, job processing, monitoring, real-world examples

## Usage

### When to Use This Skill

Invoke this skill when:
- Building or troubleshooting NestJS applications
- Implementing NestJS patterns and best practices
- Seeking architectural guidance for Node.js backend services
- Creating controllers, services, modules, or other NestJS components
- Integrating databases (TypeORM, Prisma, Mongoose)
- Implementing authentication and authorization
- Building microservices or GraphQL APIs
- Setting up WebSockets, caching, or background jobs
- Writing tests or optimizing performance

### Example Requests

**Component Creation**:
- "Create a REST API for managing products with CRUD operations"
- "Generate a JWT authentication guard with role-based access"
- "Build a GraphQL resolver for user management"

**Database Integration**:
- "Set up TypeORM with PostgreSQL and create a User entity"
- "Show me how to implement transactions in Prisma"
- "Create a Mongoose schema for a blog post with comments"

**Architecture**:
- "What's the best way to structure a NestJS microservices application?"
- "How should I organize modules for a multi-tenant application?"
- "Recommend a caching strategy for an e-commerce API"

**Debugging**:
- "I'm getting a circular dependency error, how do I fix it?"
- "My WebSocket connections are not authenticating properly"
- "TypeORM migrations are failing in production"

**Best Practices**:
- "What are the security best practices for NestJS APIs?"
- "How should I implement error handling globally?"
- "What's the best way to test services with database dependencies?"

## Skill Metadata

```yaml
name: nestjs-expert
description: Expert assistance for developing NestJS applications including project setup, architecture design, component creation (controllers, services, modules, guards, interceptors, pipes), dependency injection, database integration (TypeORM, Prisma, Mongoose), authentication, authorization, microservices, GraphQL, testing, and best practices. Use when building or troubleshooting NestJS applications, implementing NestJS patterns, or seeking architectural guidance for Node.js backend services.
version: 1.0.0
degree_of_freedom: high
tags:
  - nestjs
  - nodejs
  - typescript
  - backend
  - api
  - microservices
  - graphql
```

## File Structure

```
nestjs-expert/
├── SKILL.md                          # Main skill file with core instructions
├── README.md                         # This file
└── reference/                        # Progressive disclosure reference files
    ├── database-typeorm.md          # TypeORM integration patterns
    ├── database-prisma.md           # Prisma integration patterns
    ├── database-mongoose.md         # Mongoose integration patterns
    ├── microservices.md             # Microservices architecture
    ├── graphql.md                   # GraphQL implementation
    ├── websockets.md                # WebSocket integration
    ├── caching.md                   # Caching strategies
    ├── scheduling.md                # Task scheduling
    └── queues.md                    # Background job processing
```

## Design Principles

### High Degree of Freedom
The skill provides:
- Clear patterns and examples
- Flexibility in implementation choices
- Multiple approaches for common tasks
- Context-aware recommendations

### Conciseness
- Assumes Claude's intelligence
- Minimal explanatory text
- Focus on code examples
- Progressive disclosure for details

### Production-Ready Code
All generated code includes:
- Proper TypeScript types and interfaces
- Error handling with appropriate HTTP exceptions
- Input validation using class-validator
- Dependency injection patterns
- Async/await for asynchronous operations
- Security best practices

### Best Practices
- Single responsibility principle
- SOLID principles
- DRY (Don't Repeat Yourself)
- Proper error handling
- Security considerations
- Performance optimizations
- Testability

## Key Features

### Code Generation
- Complete, working code examples
- Proper imports and dependencies
- TypeScript type safety
- NestJS decorators and conventions
- Error handling patterns

### Architecture Guidance
- Module organization strategies
- Design pattern recommendations
- Scalability considerations
- Microservices patterns
- Database design

### Debugging Support
- Common error identification
- Root cause analysis
- Specific fix recommendations
- Prevention strategies

### Concept Explanation
- When and why to use patterns
- Trade-offs of different approaches
- Real-world use cases
- Best practice rationale

## Examples

### Generate a REST API Resource

**Request**: "Create a REST API for managing blog posts with CRUD operations, pagination, and authentication"

**Generated Output**:
- Complete controller with all CRUD endpoints
- Service with business logic
- DTOs for validation
- Entity/schema definition
- Module configuration
- Authentication guards
- Pagination implementation
- Error handling

### Database Integration

**Request**: "Set up Prisma with PostgreSQL and create models for a multi-tenant SaaS application"

**Generated Output**:
- Prisma schema with proper relationships
- Module and service setup
- Query examples with filtering
- Transaction patterns
- Multi-tenancy implementation
- Migration commands

### Microservices Setup

**Request**: "Build a microservices architecture with RabbitMQ for order processing"

**Generated Output**:
- Microservice configuration
- Message patterns
- Event handlers
- Error handling
- Saga pattern implementation
- Circuit breaker pattern

## Version History

- **1.0.0** - Initial release with comprehensive NestJS development coverage

## Contributing

This skill follows the official Agent Skills best practices:
- Progressive disclosure pattern
- High degree of freedom
- Concise instructions
- Production-ready code examples
- Proper file organization

## License

This skill is part of the Skill Development Agent project.

## Related Skills

This skill works well with:
- TypeScript development skills
- Database design skills
- API design skills
- Testing and QA skills
- DevOps and deployment skills

## Support

For issues or questions about this skill:
1. Check the reference files for detailed information
2. Review the examples in SKILL.md
3. Ensure you're using the latest version
4. Provide context about your use case for better assistance

## Acknowledgments

Based on official NestJS documentation and community best practices.
