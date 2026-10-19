import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export class PublicationNotAuthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicationNotAuthorizedError";
  }
}

/**
 * Refuse public distribution unless the work's rights record authorizes it for
 * this exact chapter. `rights.md` is the only source of this decision: the flag
 * alone is not enough, because a record may authorize some chapters only.
 *
 * @param {string} workDir
 * @param {string} chapterId
 */
export function assertPublicationAuthorized(workDir, chapterId) {
  const rightsPath = path.join(workDir, "rights.md");
  if (!fs.existsSync(rightsPath)) {
    throw new PublicationNotAuthorizedError(
      `${rightsPath} is missing; refusing public distribution`
    );
  }

  const { data } = matter(fs.readFileSync(rightsPath, "utf8"));
  const workId = path.basename(workDir);
  if (data.type !== "Audiobook Rights Record" || data.work_id !== workId) {
    throw new PublicationNotAuthorizedError(
      `${rightsPath} is not the Audiobook Rights Record of ${workId}`
    );
  }
  if (data.public_distribution_authorized !== true) {
    throw new PublicationNotAuthorizedError(
      `public distribution is not authorized in ${rightsPath}`
    );
  }
  const chapters = Array.isArray(data.authorized_chapters)
    ? data.authorized_chapters
    : [];
  if (!chapters.includes(chapterId)) {
    throw new PublicationNotAuthorizedError(
      `${chapterId} is not listed in authorized_chapters of ${rightsPath}`
    );
  }
}
