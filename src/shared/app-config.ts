import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export class AppConfig {
    public static readonly GITHUB_TOKEN: string = AppConfig.getEnvVar('GITHUB_TOKEN'); 
    public static readonly GITHUB_TOKEN_CLASSIC: string = AppConfig.getEnvVar('GITHUB_TOKEN_CLASSIC');
    public static readonly ENTERPRISE: string = AppConfig.getEnvVar('ENTERPRISE');
    public static readonly API_VERSION: string = AppConfig.getEnvVar('GITHUB_API_VERSION');
    public static readonly ORGANIZATION: string = AppConfig.getEnvVar('ORGANIZATION');
    public static readonly TIME_PERIOD: string = AppConfig.getEnvVar('TIME_PERIOD');
    public static readonly GENERATE_DATA: boolean = AppConfig.getEnvVar('GENERATE_DATA').toLowerCase() === 'true';
    
    private static getEnvVar(name: string): string {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Environment variable ${name} is not set`);
        }
        return value;
    }
}