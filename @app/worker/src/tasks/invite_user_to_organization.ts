import { Task } from "graphile-worker";

import supabase from "../utils/supabase";
import { SendEmailPayload } from "./send_email";

interface InviteUserToOrganizationPayload {
  email: string;
  firstname?: string;
  lastname?: string;
  organizationId: string;
  organizationName: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
}

const task: Task = async (inPayload, { addJob }) => {
  const payload = inPayload as InviteUserToOrganizationPayload;
  const {
    email,
    firstname = "",
    lastname = "",
    organizationId,
    organizationName,
    role = "MEMBER",
  } = payload;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: {
        firstname,
        lastname,
      },
      redirectTo: `${process.env.ROOT_URL}/set-password`,
    },
  });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Failed to generate invite link");
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      user_id: data.user.id,
      organization_id: organizationId,
      role,
      is_active: true,
    });

  if (memberError) {
    throw memberError;
  }

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: `Invitation to join ${organizationName}`,
    },
    template: "invite_user_to_organization.mjml",
    variables: {
      firstname,
      lastname,
      organizationName,
      ctaUrl: data.properties.action_link,
    },
  };

  await addJob("send_email", sendEmailPayload);
};

module.exports = task;
