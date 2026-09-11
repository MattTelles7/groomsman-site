import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { CALENDAR_PATH, renderCalendar } from './src/lib/calendar.ts';

export default defineConfig({ plugins: [react(), {
  name: 'wedding-calendar',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: CALENDAR_PATH.slice(1), source: renderCalendar() });
  },
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.split('?')[0] !== CALENDAR_PATH) return next();
      try {
        // Load through Vite so editing the schedule also updates the dev feed.
        const calendar = await server.ssrLoadModule('/src/lib/calendar.ts');
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(calendar.renderCalendar());
      } catch (error) {
        next(error);
      }
    });
  },
}] });
