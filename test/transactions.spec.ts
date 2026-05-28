import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { app } from '../src/app'

describe('Transactions routes', () => {
	//Função que executa antes de todas as funções
	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		execSync('npm run knex migrate:rollback --all')
		//Atualizando migrations no banco teste
		execSync('npm run knex migrate:latest')
	})

	test('It should be able to create a new transaction', async () => {
		await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit'
			})
			.expect(201)
	})

	test('It should be able to list all transactions', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit'
			})

		const cookies = createTransactionResponse.get('Set-Cookie') ?? []

		const listTransactionsResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200)

		expect(listTransactionsResponse.body.transactions).toEqual([
			expect.objectContaining({
				title: 'New transaction',
				amount: 5000,
			})
		])
	})

	test('It should be able to get a specific transaction', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit'
			})

		const cookies = createTransactionResponse.get('Set-Cookie') ?? []

		const listTransactionsResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200)

		const id = listTransactionsResponse.body.transactions[0].id

		const transactionResponse = await request(app.server)
			.get(`/transactions/${id}`)
			.set('Cookie', cookies)
			.expect(200)

		expect(transactionResponse.body.transaction).toEqual(
			expect.objectContaining({
				id: id,
				title: 'New transaction',
				amount: 5000,
			})
		)
	})

	test('It should be able to get the summary', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit'
			})

		const cookies = createTransactionResponse.get('Set-Cookie') ?? []

		await request(app.server)
			.post('/transactions')
			.send({
				title: 'Debit transaction',
				amount: 2000,
				type: 'debit'
			})
			.set('Cookie', cookies)

		const summaryResponse = await request(app.server)
			.get('/transactions/summary')
			.set('Cookie', cookies)
			.expect(200)

		expect(summaryResponse.body.summary).toEqual(
			{
				amount: 3000
			}
		)
	})
})

//test.skip/todo/only. todo=lembrete