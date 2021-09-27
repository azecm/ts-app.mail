import styled from "styled-components";
import { BoxView } from "./BoxView";
import { DetailsView } from "./details/DetailsView";
import { connect } from "react-redux";
import { AppDispatchProp, StoreState } from "../store";
import { MailBoxes, MailBoxType } from "../common/types";
import Notes from "./notes";
import { UIEvent, useCallback, useEffect, useRef } from "react";
import { loadBoxPage } from "../requests/loadBoxPage";
import isNil from "lodash/isNil";

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-grow: 1;
  position: relative;
`;

const Column1 = styled.div`
  top: 0;
  bottom: 0;
  position: absolute;

  left: 0;
  right: 50vw;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f7f2ec;
`;

const Column2 = styled.div`
  top: 0;
  bottom: 0;
  position: absolute;

  left: 50vw;
  right: 0;
`;

const Scrolled = styled.div`
  overflow-y: auto;
  height: 100%;
`;

const scrolls = new Map<MailBoxes, number>();
const loading = new Map<MailBoxes, boolean>();
const noteDetails = { scroll: 0 };

type AppBodyProps = { currentBox: MailBoxes; currentPage: number } & AppDispatchProp;

export const AppBody = connect((state: StoreState) => {
  const { box } = state.users;
  const currentPage = state.boxes[MailBoxes[box] as MailBoxType]?.page ?? 0;
  return { currentBox: box, currentPage };
})(AppBodyElement);

function AppBodyElement({ currentPage, currentBox, dispatch }: AppBodyProps) {
  const scrollListRef = useRef<HTMLDivElement>(null);
  const scrollDetailsRef = useRef<HTMLDivElement>(null);

  const onScrollDetails = useCallback(
    async (e: UIEvent<HTMLElement>) => {
      if (currentBox === MailBoxes.notes) {
        const target = e.currentTarget;
        noteDetails.scroll = target.scrollTop;
      }
    },
    [currentBox],
  );

  const onScrollList = useCallback(
    async (e: UIEvent<HTMLElement>) => {
      const target = e.currentTarget;
      scrolls.set(currentBox, target.scrollTop);
      if (currentBox !== MailBoxes.notes && target.scrollHeight > target.offsetHeight) {
        const scrollMax = target.scrollHeight - target.offsetHeight;
        if (scrollMax - target.scrollTop < 10 && !loading.get(currentBox)) {
          loading.set(currentBox, true);
          await loadBoxPage(currentBox, currentPage || 0, dispatch);
          loading.set(currentBox, false);
        }
      }
    },
    [currentBox, currentPage, dispatch],
  );

  useEffect(() => {
    const top = scrolls.get(currentBox);
    const lr = scrollListRef.current;
    if (lr && !isNil(top)) {
      setTimeout(() => {
        lr.scrollTop = top;
      }, 0);
    }

    const dr = scrollDetailsRef.current;
    if (dr && currentBox === MailBoxes.notes && noteDetails.scroll) {
      setTimeout(() => {
        dr.scrollTop = noteDetails.scroll;
      }, 0);
    }
  }, [currentBox]);

  return (
    <Container>
      <Column1 onScroll={onScrollDetails} ref={scrollDetailsRef}>
        <DetailsView />
      </Column1>
      <Column2>
        <Scrolled onScroll={onScrollList} ref={scrollListRef}>
          <ListView currentBox={currentBox} />
        </Scrolled>
      </Column2>
    </Container>
  );
}

function ListView({ currentBox }: { currentBox: MailBoxes }) {
  const isNotes = currentBox === MailBoxes.notes;
  return (
    <>
      <div style={{ display: isNotes ? void 0 : "none" }}>
        <Notes />
      </div>
      <div>{isNotes ? null : <BoxView />}</div>
    </>
  );
}
