import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Les pages chargées à la demande (lazy) sont transformées au premier test qui les ouvre : sous charge,
    // le délai par défaut de 5 s faisait échouer au hasard « connecte la personne… » sans défaut réel.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'html'],
      // Exigence du cahier des charges : au moins 60 % des lignes couvertes.
      thresholds: { lines: 60 },
    },
  },
})
