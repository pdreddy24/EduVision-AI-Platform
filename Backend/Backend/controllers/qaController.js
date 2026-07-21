import Conversation from "../models/Conversation.js";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { rankChunks } from "../services/retrievalService.js";
import {
  buildSources,
  generateGroundedAnswer,
} from "../services/qaService.js";
import { validateQuestion } from "../services/qaSecurityService.js";
import { assertQaBudgetAvailable } from "../services/costLimitService.js";

async function getOwnedDocument(id, userId) {
  return Document.findOne({
    _id: id,
    userId,
  });
}

function serializeConversation(conversation, includeMessages = true) {
  return {
    id: conversation._id,
    documentId: conversation.documentId,
    title: conversation.title,
    messageCount: conversation.messages.length,
    ...(includeMessages && {
      messages: conversation.messages,
    }),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function handleControllerError(error, res, next, notFoundMessage) {
  if (error?.code === "DAILY_QA_TOKEN_LIMIT") return next(error);
  if (error?.name === "CastError") {
    return res.status(404).json({
      message: notFoundMessage,
    });
  }

  /*
   * The request has already passed the application's authentication
   * middleware. A 401 raised inside this controller is therefore normally
   * coming from OpenAI, not from the user's EduVision login.
   *
   * Convert it to 503 so the frontend does not mistake it for an expired
   * EduVision token and sign the user out.
   */
  if (
    error?.status === 401 ||
    error?.name === "AuthenticationError" ||
    error?.code === "invalid_api_key"
  ) {
    const configurationError = new Error(
      "OpenAI authentication failed. Check OPENAI_API_KEY in Backend/Backend/.env."
    );

    configurationError.status = 503;
    return next(configurationError);
  }

  if (error?.status === 403) {
    const permissionError = new Error(
      "The OpenAI project does not have permission to use the configured QA model."
    );

    permissionError.status = 503;
    return next(permissionError);
  }

  if (error?.status === 429) {
    const rateLimitError = new Error(
      "OpenAI rate limit or account quota reached. Please try again later and check your OpenAI billing."
    );

    rateLimitError.status = 503;
    return next(rateLimitError);
  }

  if (error?.status === 404 && error?.name !== "CastError") {
    const modelError = new Error(
      "The configured QA model was not found or is not available to this OpenAI project. Check QA_MODEL."
    );

    modelError.status = 503;
    return next(modelError);
  }

  if (error?.status >= 500) {
    const serviceError = new Error(
      "OpenAI is temporarily unavailable. Please try again later."
    );

    serviceError.status = 503;
    return next(serviceError);
  }

  return next(error);
}

export async function askQuestion(req, res, next) {
  try {
    const validation = validateQuestion(req.body?.question);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.reason,
      });
    }

    await assertQaBudgetAvailable(req.user.id);

    const document = await getOwnedDocument(
      req.params.id,
      req.user.id
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const chunks = await DocumentChunk.find({
      documentId: document._id,
      userId: req.user.id,
    })
      .sort({ chunkIndex: 1 })
      .lean();

    if (!chunks.length) {
      return res.status(409).json({
        message:
          "Optimize this document before asking questions",
      });
    }

    let conversation = null;

    if (req.body?.conversationId) {
      conversation = await Conversation.findOne({
        _id: req.body.conversationId,
        documentId: document._id,
        userId: req.user.id,
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user.id,
        documentId: document._id,
        title: validation.question.slice(0, 100),
        messages: [],
      });
    }

    const rankedChunks = rankChunks(
      validation.question,
      chunks,
      5
    );

    const sources = buildSources(rankedChunks);

    const history = conversation.messages.map(
      ({ role, content }) => ({
        role,
        content,
      })
    );

    const result = await generateGroundedAnswer({
      question: validation.question,
      sources,
      history,
    });

    conversation.messages.push({
      role: "user",
      content: validation.question,
    });

    conversation.messages.push({
      role: "assistant",
      content: result.answer,
      citations: result.citations,
      grounded: result.grounded,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
    });

    await conversation.save();

    return res.json({
      conversation: serializeConversation(conversation),
      answer: result.answer,
      grounded: result.grounded,
      citations: result.citations,
      retrievedSources: sources.map(
        ({ sourceId, pageNumbers, tokenCount }) => ({
          sourceId,
          pageNumbers,
          tokenCount,
        })
      ),
      usage: result.usage,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      next,
      "Document or conversation not found"
    );
  }
}

export async function listDocumentConversations(
  req,
  res,
  next
) {
  try {
    const document = await getOwnedDocument(
      req.params.id,
      req.user.id
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const conversations = await Conversation.find({
      documentId: document._id,
      userId: req.user.id,
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    return res.json({
      conversations: conversations.map((conversation) =>
        serializeConversation(conversation, false)
      ),
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      next,
      "Document not found"
    );
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.json({
      conversation: serializeConversation(conversation),
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      next,
      "Conversation not found"
    );
  }
}
