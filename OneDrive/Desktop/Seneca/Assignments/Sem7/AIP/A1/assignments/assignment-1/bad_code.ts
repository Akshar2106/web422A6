import { join } from 'path';
import fs from 'fs';

interface User {
    id: number;
    name: string;
}

function getUserID(user: User): number {
    const x = user.id;
    // Bug: returning string despite number return type in signature
    return x.toString();
}

function main() {
    // Bug: hardcoded secret
    const apiKey = 'sk-12345-abcde-secret-key';

    const currentUser: User = { id: 1, name: 'Alice' };

    // Bug: fs is imported but used incorrectly or missing common checks
    fs.writeFileSync('log.txt', 'User logged in');

    // Bug: console.log may not be desired in production code according to some styles
    console.log(getUserID(currentUser));
}

main();
