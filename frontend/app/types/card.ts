export interface Card {
    id?: number;
    card_name: string;
    card_number_last4?: string;
    card_type?: string;
    current_balance?: number;
    credit_limit?: number;
    is_active?: boolean;
    account_id: number;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CardFormData {
    card_name: string;
    card_number_last4: string;
    card_type: string;
    credit_limit: string | number;
    account_id: string | number;
}