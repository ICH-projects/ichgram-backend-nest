import { Injectable } from '@nestjs/common';
import * as imaps from 'imap-simple';

@Injectable()
export class GmailImapService {
  async checkEmailExists(): Promise<boolean> {
    const config = {
      imap: {
        user: process.env.GOOGLE_EMAIL,
        password: process.env.GOOGLE_PASSWORD, // <--- 16-digit password
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false, // <--- allow Gmail certificate
        },
        authTimeout: 3000,
      },
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Search for emails that match the query
    const searchCriteria = [
      ['HEADER', 'FROM', 'mailer-daemon@googlemail.com'], // or SUBJECT, TO, TEXT, etc.
    ];
    const fetchOptions = { bodies: ['HEADER'], struct: true };

    const results = await connection.search(searchCriteria, fetchOptions);

    await connection.end();

    return results.length > 0;
  }
}
