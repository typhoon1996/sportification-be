#!/usr/bin/env node

const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    SWAGGER DOCUMENTATION VALIDATION                           ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

// Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sportification API',
    version: '1.0.0',
    description: 'Comprehensive API documentation validation',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/app.ts',
    './src/modules/**/api/routes/*.ts',
    './src/modules/**/api/controllers/*.ts',
  ],
};

console.log('📋 Generating Swagger specification from JSDoc annotations...\n');

try {
  const specs = swaggerJSDoc(options);
  
  const totalPaths = Object.keys(specs.paths || {}).length;
  const totalOperations = Object.values(specs.paths || {}).reduce((sum, path) => {
    return sum + Object.keys(path).length;
  }, 0);
  
  console.log('📊 Overview:');
  console.log('   - Total Endpoints:', totalPaths);
  console.log('   - Total Operations:', totalOperations);
  console.log('   - OpenAPI Version:', specs.openapi);
  console.log('');
  
  // Validate each endpoint
  console.log('🔍 Validating Each Endpoint:\n');
  
  let validEndpoints = 0;
  let issuesFound = [];
  const endpointsByModule = {};
  
  Object.entries(specs.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, spec]) => {
      const endpoint = `${method.toUpperCase()} ${path}`;
      let issues = [];
      
      // Required fields validation
      if (!spec.summary) issues.push('Missing summary');
      if (!spec.description && !spec.summary) issues.push('Missing description');
      if (!spec.tags || spec.tags.length === 0) issues.push('Missing tags');
      if (!spec.responses) {
        issues.push('Missing responses');
      } else {
        // Check for success responses
        const hasSuccess = Object.keys(spec.responses).some(code => code.startsWith('2'));
        if (!hasSuccess) issues.push('No success response codes (2xx)');
        
        // Check for error responses
        const has4xx = Object.keys(spec.responses).some(code => code.startsWith('4'));
        const has5xx = Object.keys(spec.responses).some(code => code.startsWith('5'));
        if (!has4xx && !has5xx) issues.push('Missing error responses');
      }
      
      // Track by module
      const module = spec.tags?.[0] || 'Unknown';
      if (!endpointsByModule[module]) {
        endpointsByModule[module] = { valid: 0, issues: 0 };
      }
      
      if (issues.length > 0) {
        issuesFound.push({ endpoint, issues, module });
        endpointsByModule[module].issues++;
      } else {
        validEndpoints++;
        endpointsByModule[module].valid++;
      }
    });
  });
  
  console.log('✅ Valid Endpoints:', validEndpoints);
  console.log('⚠️  Endpoints with Issues:', issuesFound.length);
  console.log('');
  
  // Module breakdown
  console.log('📦 Module Breakdown:\n');
  Object.entries(endpointsByModule).sort().forEach(([module, stats]) => {
    const total = stats.valid + stats.issues;
    const status = stats.issues === 0 ? '✅' : '⚠️ ';
    console.log(`   ${status} ${module}: ${stats.valid}/${total} valid`);
  });
  console.log('');
  
  // Show issues if any
  if (issuesFound.length > 0) {
    console.log('⚠️  Issues Found:\n');
    issuesFound.slice(0, 10).forEach(item => {
      console.log(`   ❌ ${item.endpoint}`);
      item.issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('');
    });
    
    if (issuesFound.length > 10) {
      console.log(`   ... and ${issuesFound.length - 10} more endpoints with issues\n`);
    }
  } else {
    console.log('✅ All endpoints are properly documented!\n');
  }
  
  // Sample endpoint details
  console.log('📝 Sample Endpoint Details:\n');
  const samples = [
    { path: '/auth/register', method: 'post' },
    { path: '/matches', method: 'post' },
    { path: '/matches', method: 'get' },
    { path: '/api/v1/tournaments', method: 'post' },
  ];
  
  samples.forEach(sample => {
    const endpoint = specs.paths[sample.path]?.[sample.method];
    if (endpoint) {
      console.log(`   ${sample.method.toUpperCase()} ${sample.path}`);
      console.log(`      Summary: ${endpoint.summary || 'N/A'}`);
      console.log(`      Tags: ${endpoint.tags?.join(', ') || 'N/A'}`);
      console.log(`      Security: ${endpoint.security ? 'Required' : 'Public'}`);
      
      if (endpoint.requestBody) {
        const schema = endpoint.requestBody.content?.['application/json']?.schema;
        if (schema) {
          console.log(`      Request: ${schema.required?.join(', ') || 'No required fields'}`);
        }
      }
      
      const responseCodes = Object.keys(endpoint.responses || {});
      console.log(`      Responses: ${responseCodes.join(', ')}`);
      console.log('');
    }
  });
  
  // Write full spec to file
  const outputPath = '/tmp/swagger-validation-result.json';
  fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
  console.log(`📄 Full specification written to: ${outputPath}\n`);
  
  // Summary
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              VALIDATION SUMMARY                               ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Endpoints: ${totalPaths.toString().padEnd(60)} ║`);
  console.log(`║  Total Operations: ${totalOperations.toString().padEnd(59)} ║`);
  console.log(`║  Valid Endpoints: ${validEndpoints.toString().padEnd(60)} ║`);
  console.log(`║  Issues Found: ${issuesFound.length.toString().padEnd(63)} ║`);
  console.log(`║  Status: ${(issuesFound.length === 0 ? '✅ ALL VALIDATED' : '⚠️  NEEDS REVIEW').padEnd(67)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  process.exit(issuesFound.length > 0 ? 1 : 0);
  
} catch (error) {
  console.error('❌ Error generating Swagger specification:', error.message);
  console.error(error.stack);
  process.exit(1);
}
