module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Code style (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Adding tests
        'chore',    // Build process or auxiliary tool changes
        'revert',   // Revert previous commit
        'ci',       // CI/CD changes
      ],
    ],
    'subject-case': [0], // Allow any case for subject
  },
};
