const { generateAPIDocumentation } = require('../utils/documentationGenerator');
const { generateDiagrams } = require('../utils/diagramGenerator');

async function generateCompleteDocumentation() {
    try {
        // Generate diagrams first
        console.log('Generating diagrams...');
        const diagramsResult = generateDiagrams();
        console.log('Diagrams generated successfully at:', diagramsResult.diagramsDir);

        // Generate API documentation
        console.log('Generating API documentation...');
        const docResult = await generateAPIDocumentation();
        console.log('API documentation generated successfully at:', docResult.filePath);

        console.log('\nDocumentation generation complete!');
        console.log('----------------------------------------');
        console.log('Generated files:');
        console.log('1. API Documentation PDF:', docResult.filename);
        console.log('2. Diagrams Directory:', diagramsResult.diagramsDir);
        console.log('\nNote: To view the diagrams, use a Mermaid.js compatible viewer or convert them to images using the Mermaid CLI.');

    } catch (error) {
        console.error('Error generating documentation:', error);
        process.exit(1);
    }
}

// Run the documentation generator
generateCompleteDocumentation(); 