import { hashPassword, comparePassword } from "../../../src/utils/password";
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('password utils', () => {
    describe('hashPassword', () => {
        it('should hash a password with bcrypt', async () => {
            const password = 'password123';
            (bcrypt.hash as jest.Mock).mockResolvedValue(password);

            const result = await hashPassword(password);

            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
            expect(result).toBe(password);
        });
    });

    describe('comparePassword', () => {
        it('should compare a password with a hash', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await comparePassword('plain', 'hash');

            expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hash');
            expect(result).toBe(true);
        });

        it('should return false if the password is incorrect', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await comparePassword('plain', 'hash');

            expect(result).toBe(false);
        });
    });
});