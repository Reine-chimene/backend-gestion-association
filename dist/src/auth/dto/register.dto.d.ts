export declare class RegisterDto {
    email: string;
    password: string;
    tenantId: string;
    role: 'PRESIDENT' | 'TRESORIER' | 'SECRETAIRE' | 'COMMISSAIRE' | 'MEMBRE';
    associationNom?: string;
    associationSlug?: string;
    associationDevise?: string;
    associationLangue?: string;
}
