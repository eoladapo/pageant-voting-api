import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pageant Voting System API',
      version: '2.0.0',
      description: 'A comprehensive API for managing pageant contestants, voting system, user registration, and admin management',
      contact: {
        name: 'API Support',
        email: 'support@pageantvoting.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4545',
        description: 'Development server',
      },
      {
        url: 'https://pageant-voting-api.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'phone'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated user ID',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            age: {
              type: 'number',
              minimum: 16,
              maximum: 100,
            },
            photo: {
              type: 'string',
              description: 'URL to user photo',
            },
            bio: {
              type: 'string',
              maxLength: 1000,
            },
            category: {
              type: 'string',
              enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
            },
            socialMedia: {
              type: 'object',
              properties: {
                instagram: { type: 'string' },
                facebook: { type: 'string' },
                twitter: { type: 'string' },
                tiktok: { type: 'string' },
              },
            },
            paymentStatus: {
              type: 'string',
              enum: ['paid', 'not_required', 'pending'],
            },
            contestantStatus: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
            },
            transactionReference: {
              type: 'string',
            },
            registeredAt: {
              type: 'string',
              format: 'date-time',
            },
            approvedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Admin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              default: 'admin',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AppSettings: {
          type: 'object',
          properties: {
            requirePaymentBeforeRegistration: {
              type: 'boolean',
              default: false,
              description: 'Whether payment is required before registration',
            },
            registrationFee: {
              type: 'number',
              default: 5000,
              minimum: 0,
              description: 'Registration fee amount',
            },
            votingEnabled: {
              type: 'boolean',
              default: true,
              description: 'Whether voting is currently enabled',
            },
            registrationEnabled: {
              type: 'boolean',
              default: true,
              description: 'Whether registration is currently enabled',
            },
            pricePerVote: {
              type: 'number',
              default: 100,
              minimum: 0,
              description: 'Price per single vote',
            },
            minimumVoteUnit: {
              type: 'number',
              default: 5,
              minimum: 1,
              description: 'Minimum number of votes required for votes to count towards contestant. Votes below this threshold will be paid for but not counted.',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Voter: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated voter ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Voter email address',
            },
            name: {
              type: 'string',
              description: 'Voter full name',
            },
            hasVoted: {
              type: 'boolean',
              description: 'Whether the voter has cast any votes',
            },
            votedFor: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  candidateId: {
                    type: 'string',
                  },
                  category: {
                    type: 'string',
                    enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Candidate: {
          type: 'object',
          required: ['name', 'age', 'photo', 'category'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated candidate ID',
            },
            userId: {
              type: 'string',
              description: 'Reference to User model',
            },
            name: {
              type: 'string',
              description: 'Candidate full name',
            },
            age: {
              type: 'number',
              minimum: 16,
              maximum: 100,
              description: 'Candidate age',
            },
            photo: {
              type: 'string',
              description: 'URL to candidate photo',
            },
            bio: {
              type: 'string',
              maxLength: 1000,
              description: 'Candidate biography',
            },
            category: {
              type: 'string',
              enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
              description: 'Pageant category',
            },
            socialMedia: {
              type: 'object',
              properties: {
                instagram: { type: 'string' },
                facebook: { type: 'string' },
                twitter: { type: 'string' },
                tiktok: { type: 'string' },
              },
            },
            votes: {
              type: 'number',
              description: 'Total votes received',
              default: 0,
            },
            isActive: {
              type: 'boolean',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Transaction: {
          type: 'object',
          required: ['fullName', 'email', 'phone', 'amount', 'paymentMethod'],
          properties: {
            _id: {
              type: 'string',
            },
            userId: {
              type: 'string',
              description: 'Reference to User model',
            },
            fullName: {
              type: 'string',
              description: 'Payer full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Payer email',
            },
            phone: {
              type: 'string',
              description: 'Payer phone number',
            },
            purpose: {
              type: 'string',
              enum: ['registration_fee', 'vote_purchase'],
              description: 'Transaction purpose',
            },
            candidateId: {
              type: 'string',
              description: 'ID of candidate (for vote_purchase)',
            },
            numberOfVotes: {
              type: 'number',
              description: 'Number of votes purchased (for vote_purchase)',
            },
            amount: {
              type: 'number',
              description: 'Payment amount',
            },
            paymentMethod: {
              type: 'string',
              enum: ['paystack', 'flutterwave', 'bank_transfer'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'successful', 'failed', 'cancelled'],
            },
            paymentReference: {
              type: 'string',
            },
            votesApplied: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Vote: {
          type: 'object',
          required: ['transactionId', 'candidateId', 'category'],
          properties: {
            _id: {
              type: 'string',
            },
            transactionId: {
              type: 'string',
              description: 'ID of the transaction',
            },
            candidateId: {
              type: 'string',
              description: 'ID of the candidate',
            },
            category: {
              type: 'string',
              enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
            },
            numberOfVotes: {
              type: 'number',
            },
            voterEmail: {
              type: 'string',
            },
            voterName: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
