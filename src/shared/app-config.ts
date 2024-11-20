import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export class AppConfig {
    public static readonly GITHUB_TOKEN: string = AppConfig.getEnvVar('GITHUB_TOKEN');
    public static readonly ENTERPRISE: string = AppConfig.getEnvVar('ENTERPRISE');
    public static readonly API_VERSION: string = AppConfig.getEnvVar('GITHUB_API_VERSION');

    private static getEnvVar(name: string): string {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Environment variable ${name} is not set`);
        }
        return value;
    }
}