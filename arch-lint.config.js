// Placeholder architecture lint configuration. If you add an arch-lint tool later,
// adapt this structure to that tool's expected format.

export default {
  layers: [
    { name: 'presentation', patterns: ['src/presentation/**'] },
    { name: 'application', patterns: ['src/application/**'] },
    { name: 'domain', patterns: ['src/domain/**', 'src/core/domain/**'] },
    { name: 'infrastructure', patterns: ['src/infrastructure/**'] },
    { name: 'core', patterns: ['src/core/**'] }
  ],
  rules: [
    // presentation can depend on application and core only
    { from: 'presentation', to: ['application', 'core'] },
    // application can depend on domain and core only
    { from: 'application', to: ['domain', 'core'] },
    // domain can depend on core only
    { from: 'domain', to: ['core'] },
    // infrastructure cannot be imported by any other layer directly
    { from: 'infrastructure', to: [] },
    // core should be dependency-free (except standard libs)
    { from: 'core', to: [] }
  ]
};
