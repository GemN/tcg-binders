import assert from "node:assert/strict";
import test from "node:test";

import { createInstance } from "i18next";

import enBinder from "../../assets/locales/en/binder.json" with { type: "json" };
import thBinder from "../../assets/locales/th/binder.json" with { type: "json" };
import { getBinderEditingErrorMessage } from "./presentation.ts";
import {
  BinderEditingCoherenceError,
  BinderEditingError,
} from "./types.ts";

test("maps language-neutral Binder Editing failures to localized UI copy", () => {
  assert.equal(
    getBinderEditingErrorMessage(
      new BinderEditingError("invalid_multiplier"),
      {
        fallbackMessage: "Could not update prices",
        reasonMessages: {
          invalid_multiplier: "Enter a valid multiplier",
        },
      }
    ),
    "Enter a valid multiplier"
  );
  assert.equal(
    getBinderEditingErrorMessage(new BinderEditingError("write_failed"), {
      fallbackMessage: "Could not save the binder",
    }),
    "Could not save the binder"
  );
  assert.equal(
    getBinderEditingErrorMessage(
      new BinderEditingCoherenceError(new Error("refresh failed")),
      {
        fallbackMessage: "Could not save the binder",
        reasonMessages: {
          coherence_failed: "Saved; reload required",
        },
      }
    ),
    "Saved; reload required"
  );
});

test("English and Thai refresh failures describe saved writes truthfully", async () => {
  const i18n = createInstance();
  await i18n.init({
    fallbackLng: false,
    lng: "en",
    resources: {
      en: { binder: enBinder },
      th: { binder: thBinder },
    },
  });

  assert.equal(
    i18n.t("binder:bulk_delete.refresh_failed", {
      count: 1,
      failed: 2,
    }),
    "Deleted 1 card. Failed 2. The binder could not refresh, so reload to see the latest state."
  );
  assert.equal(
    i18n.t("binder:editing.coherence_failed"),
    "Your change was saved, but the binder could not refresh. Reload before making more changes, and do not repeat this action."
  );
  assert.equal(
    i18n.t("binder:bulk_price.refresh_failed", {
      count: 1,
      failed: 2,
      skipped: 3,
    }),
    "Updated 1 card. Failed 2. Skipped 3. The prices were saved, but the binder could not refresh. Reload before making more changes, and do not apply them again."
  );

  await i18n.changeLanguage("th");
  assert.equal(
    i18n.t("binder:bulk_delete.refresh_failed", {
      count: 1,
      failed: 2,
    }),
    "ลบการ์ดแล้ว 1 ใบ ล้มเหลว 2 ใบ แต่รีเฟรชแฟ้มไม่สำเร็จ โปรดโหลดหน้าใหม่เพื่อดูข้อมูลล่าสุด"
  );
  assert.equal(
    i18n.t("binder:editing.coherence_failed"),
    "บันทึกการเปลี่ยนแปลงแล้ว แต่รีเฟรชแฟ้มไม่สำเร็จ โปรดโหลดหน้าใหม่ก่อนแก้ไขเพิ่มเติม และอย่าทำรายการนี้ซ้ำ"
  );
  assert.equal(
    i18n.t("binder:bulk_price.refresh_failed", {
      count: 1,
      failed: 2,
      skipped: 3,
    }),
    "อัปเดตราคาแล้ว 1 ใบ ล้มเหลว 2 ใบ ข้าม 3 ใบ บันทึกราคาแล้ว แต่รีเฟรชแฟ้มไม่สำเร็จ โปรดโหลดหน้าใหม่ก่อนแก้ไขเพิ่มเติม และอย่าใช้ราคาเหล่านี้ซ้ำ"
  );
});
