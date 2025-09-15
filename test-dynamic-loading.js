const fs = require('fs');
const path = require('path');

// Test the dynamic loading system by checking if the backend can discover components
async function testDynamicLoading() {
  console.log('Testing Dynamic Component Loading System...\n');

  // Test 1: Check if generated components directory exists
  const generatedDir = path.join(__dirname, 'frontend', 'src', 'components', 'generated');
  
  if (!fs.existsSync(generatedDir)) {
    console.log('❌ Generated components directory not found');
    return;
  }
  
  console.log('✅ Generated components directory exists');

  // Test 2: List all component files
  const files = fs.readdirSync(generatedDir);
  const componentFiles = files.filter(file => 
    file.endsWith('.tsx') && 
    !file.endsWith('.test.tsx') &&
    !file.includes('Widget') // Exclude old widget components
  );

  console.log(`✅ Found ${componentFiles.length} component files:`);
  componentFiles.forEach(file => {
    console.log(`   - ${file}`);
  });

  // Test 3: Check if components have proper exports
  console.log('\n📋 Component Export Analysis:');
  
  for (const file of componentFiles.slice(0, 5)) { // Test first 5 components
    const filePath = path.join(generatedDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const componentName = file.replace('.tsx', '');
    const hasDefaultExport = content.includes('export default');
    const hasNamedExport = content.includes(`export const ${componentName}`);
    
    console.log(`   ${componentName}:`);
    console.log(`     - Default export: ${hasDefaultExport ? '✅' : '❌'}`);
    console.log(`     - Named export: ${hasNamedExport ? '✅' : '❌'}`);
    
    // Extract description from JSDoc
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    if (descriptionMatch) {
      console.log(`     - Description: "${descriptionMatch[1]}"`);
    }
  }

  // Test 4: Simulate the backend feature discovery
  console.log('\n🔍 Simulating Backend Feature Discovery:');
  
  const features = [];
  
  for (const file of componentFiles) {
    try {
      const filePath = path.join(generatedDir, file);
      const stats = fs.statSync(filePath);
      const componentName = file.replace('.tsx', '');
      
      // Read the file to get description from comments
      const content = fs.readFileSync(filePath, 'utf-8');
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      const description = descriptionMatch ? descriptionMatch[1] : `Generated component: ${componentName}`;

      features.push({
        id: componentName.toLowerCase(),
        name: componentName,
        componentName,
        filePath: `./generated/${componentName}`,
        description,
        status: 'active',
        createdAt: stats.birthtime
      });
    } catch (error) {
      console.log(`   ❌ Error processing ${file}: ${error.message}`);
    }
  }

  // Sort by creation date (newest first)
  features.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  console.log(`✅ Successfully discovered ${features.length} features:`);
  features.slice(0, 3).forEach(feature => {
    console.log(`   - ${feature.name}: ${feature.description}`);
  });

  // Test 5: Check if the DashboardHome component has the dynamic loading code
  console.log('\n🏠 Checking DashboardHome Integration:');
  
  const dashboardPath = path.join(__dirname, 'frontend', 'src', 'components', 'DashboardHome.tsx');
  if (fs.existsSync(dashboardPath)) {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
    
    const hasDynamicComponent = dashboardContent.includes('DynamicFeatureComponent');
    const hasFeatureSection = dashboardContent.includes('Generated Features');
    const hasImportLogic = dashboardContent.includes('await import');
    
    console.log(`   - DynamicFeatureComponent: ${hasDynamicComponent ? '✅' : '❌'}`);
    console.log(`   - Generated Features section: ${hasFeatureSection ? '✅' : '❌'}`);
    console.log(`   - Dynamic import logic: ${hasImportLogic ? '✅' : '❌'}`);
  } else {
    console.log('   ❌ DashboardHome.tsx not found');
  }

  // Test 6: Check if types are properly defined
  console.log('\n📝 Checking Type Definitions:');
  
  const typesPath = path.join(__dirname, 'frontend', 'src', 'types', 'index.ts');
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf-8');
    
    const hasGeneratedFeature = typesContent.includes('GeneratedFeature');
    const hasFeaturesInDashboard = typesContent.includes('features: GeneratedFeature[]');
    
    console.log(`   - GeneratedFeature interface: ${hasGeneratedFeature ? '✅' : '❌'}`);
    console.log(`   - Features in DashboardData: ${hasFeaturesInDashboard ? '✅' : '❌'}`);
  } else {
    console.log('   ❌ Types file not found');
  }

  console.log('\n🎉 Dynamic Loading System Test Complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Components discovered: ${features.length}`);
  console.log(`   - System ready for dynamic loading: ${features.length > 0 ? '✅' : '❌'}`);
  
  return features;
}

// Run the test
testDynamicLoading().catch(console.error);