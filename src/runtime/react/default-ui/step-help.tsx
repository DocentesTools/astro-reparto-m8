import { useState } from "react";

import { getRepartoConfig } from "../../config.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
import type { RepartoRouteName } from "../../routes.js";
import { repartoStepGuidance } from "../../stepHelp.js";

/**
 * The `?` button every step carries, and the guidance it opens.
 *
 * The application refuses to let a reader skip ahead, which is right and is
 * also the moment somebody meeting it for the first time is most likely to be
 * stuck: the page in front of them is correct, and they still do not know what
 * it wants. So each step answers the three questions a newcomer actually has,
 * in that order — *what* is this page, *why* does it matter, and *how* do I
 * work it — and then offers the guide for the long version.
 *
 * It is collapsed by default and never fetches anything: the copy is in the
 * dictionary, so it is present at the first paint, in the reader's language,
 * whatever the network is doing. The panel stays mounted while it is hidden so
 * a reader searching the page with their browser still finds the words.
 */
export function RepartoStepHelp({
  locale,
  route
}: {
  locale?: RepartoLocale;
  route: RepartoRouteName;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const [open, setOpen] = useState(false);
  const guidance = repartoStepGuidance(dict, route, {
    docsBase: getRepartoConfig().docsBase,
    pathname: typeof window === "undefined" ? "" : window.location.pathname
  });
  const panelId = `reparto-help-${route}`;

  return (
    <section className="not-content w-full max-w-none" data-reparto-help={route}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={formatRepartoMessage(dict.help.openFor, { step: guidance.title })}
        className="inline-flex min-h-8 items-center gap-2 rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        data-reparto-help-toggle={route}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 items-center justify-center rounded-full border border-primary/60 text-xs font-bold leading-none"
        >
          ?
        </span>
        <span>{open ? dict.help.close : dict.help.open}</span>
      </button>

      <div
        className="mt-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-help-panel={route}
        hidden={!open}
        id={panelId}
      >
        <p className="text-sm font-medium text-primary">{guidance.stage}</p>
        <p className="mt-1 text-base font-semibold text-foreground">{guidance.title}</p>

        <h3 className="mt-4 text-sm font-semibold text-foreground">{dict.help.what}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{guidance.what}</p>

        <h3 className="mt-4 text-sm font-semibold text-foreground">{dict.help.why}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{guidance.why}</p>

        <h3 className="mt-4 text-sm font-semibold text-foreground">{dict.help.how}</h3>
        <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          {guidance.how.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>

        {guidance.docsHref ? (
          <p className="mt-4 text-sm">
            <a className="font-medium text-primary underline" href={guidance.docsHref}>
              {dict.help.docs}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
