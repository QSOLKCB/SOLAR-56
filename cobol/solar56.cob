       IDENTIFICATION DIVISION.
       PROGRAM-ID. SOLAR56.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  INPUT-TEXT       PIC X(512).
       01  NORMALIZED-TEXT  PIC X(512).
       01  RESPONSE-ID      PIC X(32) VALUE "FALLBACK".
       01  MATCH-A          PIC 9(4) COMP-5 VALUE 0.
       01  MATCH-B          PIC 9(4) COMP-5 VALUE 0.
       01  MATCH-C          PIC 9(4) COMP-5 VALUE 0.

       PROCEDURE DIVISION.
       MAIN.
           ACCEPT INPUT-TEXT
           MOVE FUNCTION LOWER-CASE(INPUT-TEXT) TO NORMALIZED-TEXT

           MOVE 0 TO MATCH-A
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-A FOR ALL "strawberry"
           IF MATCH-A > 0
               MOVE "STRAWBERRY_R" TO RESPONSE-ID
               GO TO EMIT-RESPONSE
           END-IF

           MOVE 0 TO MATCH-A
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-A FOR ALL "retir"
           IF MATCH-A > 0
               MOVE "RETIREMENT_WHY" TO RESPONSE-ID
               GO TO EMIT-RESPONSE
           END-IF

           MOVE 0 TO MATCH-A MATCH-B MATCH-C
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-A FOR ALL "website"
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-B FOR ALL "react"
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-C FOR ALL "kubernetes"
           IF MATCH-A > 0 AND MATCH-B > 0 AND MATCH-C > 0
               MOVE "WEB_OVERENGINEER" TO RESPONSE-ID
               GO TO EMIT-RESPONSE
           END-IF

           MOVE 0 TO MATCH-A
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-A FOR ALL "kubernetes"
           IF MATCH-A > 0
               MOVE "KUBERNETES" TO RESPONSE-ID
               GO TO EMIT-RESPONSE
           END-IF

           MOVE 0 TO MATCH-A
           INSPECT NORMALIZED-TEXT
               TALLYING MATCH-A FOR ALL "react"
           IF MATCH-A > 0
               MOVE "REACT" TO RESPONSE-ID
               GO TO EMIT-RESPONSE
           END-IF

           MOVE "FALLBACK" TO RESPONSE-ID.

       EMIT-RESPONSE.
           DISPLAY FUNCTION TRIM(RESPONSE-ID)
           STOP RUN.
