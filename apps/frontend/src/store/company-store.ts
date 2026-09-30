import { createCompany, getCompanies } from '@/shared/api/company';
import { create } from 'zustand'

interface CompanyState {
    companies: Company[];
    selectedCompany: Company | null;
    getCompanies: () => Promise<void>;
    createCompany: (company: CreateCompanyDto) => Promise<void>;
    setSelectedCompany: (company: Company) => void;
    isCompanyChanging: boolean;
}

type EntityType = 'ИП' | 'Предприятие';

export interface Company {
    id_company: string;
    name_company: string;
    unp: string;
    entity_type: EntityType;
    ur_address: string;
    tel_1: string;
    tel_2: string;
    email: string;
    id_tip_company: number;
    docs_approved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateCompanyDto {
    name_company: string;
    unp: string;
    entity_type: EntityType;
    ur_address: string;
    tel_1: string;
    tel_2: string | null;
    email: string | null;
    id_tip_company: number;
}

const useCompanyStore = create<CompanyState>((set) => ({
    companies: [],
    selectedCompany: null,
    isCompanyChanging: false,
    getCompanies: async () => {
        const data = await getCompanies();
        set({ companies: data.companies });
        
        // После загрузки компаний проверяем localStorage
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        if (savedCompanyId && data.companies.length > 0) {
            const savedCompany = data.companies.find((company: Company) => company.id_company === savedCompanyId);
            if (savedCompany) {
                set({ selectedCompany: savedCompany });
            } else {
                // Если сохраненная компания не найдена, берем первую
                set({ selectedCompany: data.companies[0] });
                localStorage.setItem('selectedCompanyId', data.companies[0].id_company);
            }
        } else if (data.companies.length > 0) {
            // Если нет сохраненной компании, берем первую
            set({ selectedCompany: data.companies[0] });
            localStorage.setItem('selectedCompanyId', data.companies[0].id_company);
        }
    },
    createCompany: async (company: CreateCompanyDto) => {
        const newCompany = await createCompany(company);
        set((state: CompanyState) => ({ companies: [...state.companies, newCompany.company] }));
    },
    setSelectedCompany: (company: Company) => {
        set({ isCompanyChanging: true, selectedCompany: company });
        localStorage.setItem('selectedCompanyId', company.id_company);
        // Сбрасываем флаг изменения через небольшую задержку
        setTimeout(() => set({ isCompanyChanging: false }), 100);
    },
}));

export default useCompanyStore;