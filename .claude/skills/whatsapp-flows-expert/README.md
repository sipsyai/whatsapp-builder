# WhatsApp Flows Expert Skill

A comprehensive Agent Skill for WhatsApp Flows development, implementation, and troubleshooting.

## Overview

This skill provides expert assistance with WhatsApp Flows, including:
- Flow JSON creation and optimization
- Endpoint implementation and encryption
- Error debugging and resolution
- Best practices and design guidance
- Template usage and customization

## Skill Structure

```
whatsapp-flows-expert/
├── SKILL.md                      # Main skill definition
├── README.md                     # This file
└── reference/
    ├── documentation-index.md    # Index to all official documentation
    ├── quick-reference.md        # Quick reference for common patterns
    ├── examples.md               # Practical implementation examples
    └── troubleshooting.md        # Error resolution guide
```

## How to Use This Skill

### Activation

The skill activates when you need help with WhatsApp Flows:
- "Create a WhatsApp Flow for appointment booking"
- "Help me implement a Flow endpoint in Node.js"
- "What does error INVALID_ROUTING_MODEL mean?"
- "Review my Flow JSON for best practices"

### Key Features

1. **Flow JSON Development**
   - Screen design and structure
   - Component selection and configuration
   - Routing model creation
   - Dynamic data binding
   - Conditional rendering

2. **Endpoint Implementation**
   - Encryption/decryption setup
   - Request handling (INIT, data_exchange, BACK)
   - Response formatting
   - Health checks
   - Multi-language code examples

3. **Debugging & Troubleshooting**
   - Error code interpretation
   - Validation error fixes
   - Performance optimization
   - Encryption debugging

4. **Best Practices**
   - UX/UI guidelines
   - Performance optimization
   - Security implementation
   - Testing strategies

## Documentation Access

This skill has access to the complete WhatsApp Flows documentation located at:
```
C:/Users/Ali/Documents/Projects/skill-creator-agent/whatsapp-flows-docs/
```

The skill will automatically read relevant documentation files using the Read tool when needed.

### Available Documentation

- **Flow JSON Complete Specification** - All components, actions, properties
- **Endpoint Implementation Guide** - Complete setup with code examples
- **Error Codes Reference** - All error types with solutions
- **Best Practices** - Design and technical guidelines
- **Templates & Examples** - Ready-to-use Flow templates
- **API References** - Flows API, Metrics API, Webhooks
- **Security Guides** - Encryption, validation, token management

## Quick Start Examples

### Creating a Simple Flow

Ask the skill:
```
"Create a contact form Flow with name, email, and message fields"
```

The skill will generate complete Flow JSON with:
- Proper structure and versioning
- Appropriate components
- Validation and error handling
- Terminal screen with completion

### Implementing an Endpoint

Ask the skill:
```
"Show me how to implement a Flow endpoint in Python with encryption"
```

The skill will provide:
- Complete endpoint code
- Encryption/decryption functions
- Request handling logic
- Error handling
- Health check implementation

### Debugging Errors

Ask the skill:
```
"I'm getting error 'REQUIRED_PROPERTY_MISSING' on my Flow JSON"
```

The skill will:
- Explain the error cause
- Identify missing properties
- Provide corrected examples
- Reference documentation

## Reference Files

### documentation-index.md
Maps all available documentation files and explains when to use each. Provides file paths and common lookup patterns.

### quick-reference.md
Contains:
- Common Flow JSON patterns
- Component syntax reference
- Action examples
- Endpoint request/response formats
- Error code quick lookup
- Best practices checklist

### examples.md
Includes complete working examples:
- Simple contact form (no endpoint)
- Appointment booking (with endpoint)
- Survey with conditional questions
- Multi-step registration
- Dynamic cascading dropdowns
- Error handling patterns

### troubleshooting.md
Comprehensive debugging guide:
- Common validation errors
- Endpoint encryption issues
- Runtime errors
- Performance problems
- Testing checklist
- Debugging tools

## Scope and Limitations

**Project Scope:**
This skill is project-scoped because it accesses documentation files in the `whatsapp-flows-docs` directory at the project root.

**Version Support:**
- Flow JSON: Version 7.2 (latest)
- Data API: Version 4.0 (latest)
- All component versions documented

**Language Support for Endpoints:**
- Node.js (Express)
- Python (Django)
- PHP (Slim)
- Java
- C#
- Go

## Integration with Documentation

The skill uses a progressive disclosure approach:

1. **Quick answers** from reference files for common questions
2. **Detailed information** from official documentation when needed
3. **Code examples** from both reference files and documentation
4. **Best practices** applied to all responses

When you ask a question, the skill will:
1. Determine the topic area
2. Read relevant documentation using the Read tool
3. Extract specific information needed
4. Provide focused answer with code examples
5. Cite documentation sources

## Example Workflows

### Workflow 1: Create New Flow
1. User: "I need a Flow for appointment booking"
2. Skill: Asks about requirements (services, date/time, confirmation)
3. User: Provides details
4. Skill: Generates complete Flow JSON with all screens
5. User: "Add endpoint for dynamic availability"
6. Skill: Adds routing model, data_exchange actions, provides endpoint code

### Workflow 2: Debug Error
1. User: "My endpoint returns 200 but Flow shows error"
2. Skill: Reads Error_Codes documentation
3. Skill: Asks for endpoint response format
4. User: Shares response
5. Skill: Identifies data type mismatch
6. Skill: Provides corrected response with explanation

### Workflow 3: Optimize Performance
1. User: "My Flow endpoint is timing out"
2. Skill: Reviews performance best practices
3. Skill: Asks about current implementation
4. User: Shares endpoint code
5. Skill: Identifies slow database queries
6. Skill: Provides optimized code with caching

## Best Practices for Using This Skill

1. **Be specific** - "Create a Flow with date picker" vs "Create a Flow"
2. **Provide context** - Share existing code when asking for improvements
3. **Ask follow-ups** - Request clarification or deeper explanations
4. **Share errors** - Include exact error messages and codes
5. **Iterate** - Refine the Flow through conversation

## Common Use Cases

✅ **This skill excels at:**
- Generating Flow JSON from requirements
- Explaining Flow concepts and features
- Implementing endpoint encryption
- Debugging validation errors
- Reviewing Flow designs
- Providing code examples
- Interpreting error messages

❌ **Not designed for:**
- General WhatsApp API questions (use WhatsApp docs)
- Business account setup (use WhatsApp Manager)
- Message template creation (different API)
- Rate limit troubleshooting (platform issue)

## Version History

- **v1.0.0** - Initial release
  - Complete Flow JSON v7.2 support
  - Endpoint implementation guides
  - Error troubleshooting
  - Best practices integration
  - Template examples

## Related Skills

This skill focuses specifically on WhatsApp Flows. For related topics:
- **WhatsApp Cloud API** - General messaging API
- **WhatsApp Business Platform** - Account and number setup
- **Node.js/Python Development** - General programming help

## Maintenance

This skill references documentation in `whatsapp-flows-docs/`. To update:

1. Update documentation files in `whatsapp-flows-docs/`
2. Update reference files if patterns change
3. Update examples if new features added
4. Update troubleshooting for new errors
5. Increment version in SKILL.md

## Support

When the skill doesn't have an answer:
1. It will read the relevant documentation file
2. Extract the needed information
3. Provide detailed explanation
4. Cite the documentation source

If documentation doesn't cover the topic:
1. Skill will indicate documentation gap
2. Provide general programming guidance
3. Suggest checking official Meta documentation

## License

This skill is part of the skill-creator-agent project. The WhatsApp Flows documentation is provided by Meta and subject to their terms of service.
