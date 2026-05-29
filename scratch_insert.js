const fs = require('fs');
let c = fs.readFileSync('src/components/dashboard-client-wrapper.tsx', 'utf8');
c = c.replace('import { Button } from "./ui/button";', 'import { Button } from "./ui/button";\nimport { SystemUpdateBanner } from "@/components/system-update-banner";');
c = c.replace('{children}', '<SystemUpdateBanner />\n            {children}');
fs.writeFileSync('src/components/dashboard-client-wrapper.tsx', c);
