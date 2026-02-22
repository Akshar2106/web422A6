import fs from 'fs';
import { join } from 'path';

interface User {
    id: number;
    name: string;
}

function getUserID(user: User): string {
    const x = user.id;
    // BUG: Intentionally returning string while signature says number (fixed signature to test logic)
    return x.toString();
}

function main() {
    // BUG: Hardcoded secret (Security Auditor should catch)
    const apiKey = 'sk-12345-abcde-secret-key';

    const currentUser: User = { id: 1, name: 'Alice' };

    // BUG: fs.writeFileSync without try-catch or proper handling
    // Also 'fs' is not imported, only its types might be available if using node types
    fs.writeFileSync('log.txt', 'User logged in');

    console.log(getUserID(currentUser));
}

main();
