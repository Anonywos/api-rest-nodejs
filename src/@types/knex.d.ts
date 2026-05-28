import 'knex'

// Arquivos .d.ts são arquivos puramente TS, usado paara definições
declare module 'knex/types/tables'{
	export interface Tables {
		transactions: {
			id: string
			title: string
			amount: number
			created_at: string
			session_id?: string
		}
	}
}