import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* GitHub Pages serves a project repo from /<repo>/, but a repo named
   <owner>.github.io from the domain root. GITHUB_REPOSITORY is set on the
   Actions runner, so the base path resolves itself and nothing here has to
   hardcode the repository name. Local dev falls through to "/". */
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = !repo || repo.endsWith(".github.io") ? "/" : `/${repo}/`;

export default defineConfig({ base, plugins: [react()] });
