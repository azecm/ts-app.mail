import styled from "styled-components";
import { connect } from "react-redux";
import { StoreState } from "../../store";
import { getActiveEmail } from "../../common/utils";
import { MailBoxModel } from "../../common/types";
import { AttachmentPreview } from "../editor/Attachments/AttachmentPreview";

const DivContent = styled.div`
  padding: 1em;
`;

function DetailsViewMailElement({ item }: { item: MailBoxModel | undefined }) {
  if (!item) return null;
  return (
    <div>
      <AttachmentPreview attachments={item.attachments} />
      <DivContent dangerouslySetInnerHTML={{ __html: item.content }} />
    </div>
  );
}

export const DetailsViewMail = connect((state: StoreState) => ({ item: getActiveEmail(state) }))(
  DetailsViewMailElement,
);
