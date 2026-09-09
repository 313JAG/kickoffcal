import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyApiKey } from "@/lib/mcp/api-keys";
import { registerKickoffCalTools } from "@/lib/mcp/tools";
import { getAppUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const baseHandler = createMcpHandler(
  (server) => {
    registerKickoffCalTools(server);
  },
  {
    serverInfo: {
      name: "kickoffcal",
      version: "0.1.0",
    },
  },
);

async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const verified = await verifyApiKey(bearerToken);
  if (!verified) return undefined;

  return {
    token: bearerToken!,
    clientId: verified.user.id,
    scopes: verified.isPro ? ["kickoffcal:pro"] : ["kickoffcal:free"],
    extra: {
      kickoff: verified,
      email: verified.user.email,
      isPro: verified.isPro,
    },
  };
}

const authHandler = withMcpAuth(baseHandler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };

/** Public MCP endpoint URL helpers for docs / Account UI. */
export function mcpEndpointUrl(): string {
  return `${getAppUrl()}/api/mcp`;
}
