import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import z from 'zod'
import { knex } from '../database.js'
import { checkSessionId } from '../middlewares/check-session-id.js'

export async function transactionsRoutes(app: FastifyInstance) {
	// Fastify chama reply ao invés de response

	app.get('/', {
		preHandler: [checkSessionId],
	}, async (request) => {
		const { sessionId } = request.cookies

		const transactions = await knex('transactions')
			.where('session_id', sessionId)
			.select()

		return {
			transactions,
		}
	})

	app.get('/:id', {
		preHandler: [checkSessionId],
	},  async (request) => {
		const { sessionId } = request.cookies
		const getTransactionParamsSchema = z.object({
			id: z.uuid(),
		})

		const { id } = getTransactionParamsSchema.parse(request.params)

		const transaction = await knex('transactions')
			.where({
				session_id: sessionId,
				id: id,
			})
			.first()

		return {
			transaction,
		}
	})

	app.get('/summary', {
		preHandler: [checkSessionId],
	},  async (request) => {
		const { sessionId } = request.cookies
		const summary = await knex('transactions')
			.sum('amount', {as: 'amount'})
			.where('session_id', sessionId)
			.first()

		return {
			summary,
		}
	})

	app.post('/', async (request, reply) => {
		const createTransactionBodySchema = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit']),
		})

		const body = createTransactionBodySchema.parse(request.body)

		let sessionId = request.cookies.sessionId

		if (!sessionId) {
			sessionId = crypto.randomUUID()

			reply.cookie('sessionId', sessionId, {
				path: '/',
				maxAge: 60*60*24*7,// 7 days
			})
		}

		await knex('transactions')
			.insert({
				id: crypto.randomUUID(),
				title: body.title,
				amount: body.type === 'credit' ? body.amount : (body.amount * -1),
				session_id: sessionId,
			})

		return reply.status(201).send()
	})
}