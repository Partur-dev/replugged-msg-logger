import { webpack } from "replugged";
import "./style.css";

interface Message {
  id: string;
  channelId: string;
}

let enabled = false;

export async function start(): Promise<void> {
  enabled = true;
  const deleted: Message[] = [];

  const registerMod = await webpack.waitForModule<{
    _actionHandlers: {
      _orderedActionHandlers: {
        MESSAGE_DELETE?: {
          actionHandler: (msg: Message) => void;
        }[];
      };
    };
  }>(webpack.filters.byProps("register"));

  const messageDelete = registerMod._actionHandlers._orderedActionHandlers.MESSAGE_DELETE;

  if (messageDelete == undefined) {
    setTimeout(start, 1000);
    return;
  }

  const handler = messageDelete!.find((x) =>
    x.actionHandler.toString().includes("revealedMessageId"),
  )!;

  const origActionHandler = handler.actionHandler;

  const applyStyles = (msg: Message) => {
    const el = document.querySelector(`#chat-messages-${msg.channelId}-${msg.id}`)!;
    if (el.classList.contains("deleted")) return;

    if (el.querySelector("ephemeral-2nDdnn")) {
      return origActionHandler(msg);
    }

    el.classList.add("deleted");
  };

  handler.actionHandler = (msg) => {
    if (!enabled) return origActionHandler(msg);
    deleted.push(msg);
  };

  setInterval(() => {
    for (const msg of deleted) applyStyles(msg);
  }, 500);
}

export function stop(): void {
  enabled = false;
}
