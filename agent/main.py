import json
import logging
import os

import requests
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    cli,
    inference,
    metrics,
    room_io,
)
from livekit.agents.voice.events import AgentStateChangedEvent, UserStateChangedEvent
from livekit.plugins import cartesia
from typing_extensions import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from typing_extensions import NotRequired, ReadOnly, TypedDict

    class Voice(TypedDict):
        id: ReadOnly[str]
        """The ID of the voice."""

        created_at: ReadOnly[str]
        """The date and time the voice was created."""

        description: ReadOnly[str]
        """The description of the voice."""

        is_owner: ReadOnly[bool]
        """Whether your organization owns the voice."""

        is_public: ReadOnly[bool]
        """Whether the voice is publicly accessible."""

        language: ReadOnly[str]
        """The language that the given voice should speak the transcript in.

        For valid options, see [Models](https://docs.cartesia.ai/build-with-cartesia/tts-models).
        """

        name: ReadOnly[str]
        """The name of the voice."""

        gender: NotRequired[ReadOnly[str | None]]
        """The gender of the voice, if specified."""


_LANGUAGE: Literal["en"] = "en"
"""
We only support this language right now.

Use this variable to track all the places where we assume it is the only language we support.
"""

_LANGUAGE_CODE_TO_WORD: dict[Literal["en"], str] = {"en": "English"}


def _get_voice_changed_message_for_language(language: str) -> str | None:
    if language == _LANGUAGE:
        return "How do I sound now?"
    return None


def _get_voice_change_failed_message_for_language(language: str) -> str | None:
    if language == _LANGUAGE:
        return "I'm sorry, I ran into an issue updating my voice. Would you like to try again?"
    return None


class MyAgent(Agent):
    def __init__(self, language: Literal["en"]) -> None:

        super().__init__(
            instructions=(
                "You are a voice assistant created by LiveKit. Your interface with users will"
                " be voice. Pretend we're having a conversation, no special formatting or"
                " headings, just natural speech."
                f" You can only understand and speak {_LANGUAGE_CODE_TO_WORD[language]}."
            ),
        )

    async def on_enter(self) -> None:
        self.session.generate_reply(
            instructions="greet the user and ask how they're doing today"
        )


load_dotenv()


def _os_environ_get_required(name: str) -> str:
    value = os.environ.get("CARTESIA_API_KEY")
    if not value:
        raise ValueError(f"{name} is required")
    return value


_CARTESIA_API_KEY = _os_environ_get_required("CARTESIA_API_KEY")

logger = logging.getLogger("cartesia-voice-agent")


def prewarm(proc: JobProcess) -> None:
    headers = {
        "X-API-Key": _CARTESIA_API_KEY,
        "Cartesia-Version": "2026-03-01",
        "Content-Type": "application/json",
    }
    response = requests.get(
        f"https://api.cartesia.ai/voices?limit=100&language={_LANGUAGE}",
        headers=headers,
    )
    if response.status_code == 200:
        proc.userdata["cartesia_voices"] = response.json()["data"]
    else:
        logger.warning(f"Failed to fetch Cartesia voices: {response.status_code}")
        proc.userdata["cartesia_voices"] = []


server = AgentServer(setup_fnc=prewarm)


@server.rtc_session()
async def entrypoint(ctx: JobContext) -> None:
    ctx.log_context_fields = {"room": ctx.room.name}

    cartesia_voices: list["Voice"] = ctx.proc.userdata.get("cartesia_voices", [])

    tts = cartesia.TTS(
        model="sonic-latest",
        api_key=_CARTESIA_API_KEY,
        language=_LANGUAGE,
    )

    stt = cartesia.STT(
        model="ink-2",
        api_key=_CARTESIA_API_KEY,
        language=_LANGUAGE,
    )

    session: AgentSession = AgentSession(
        stt=stt,
        llm=inference.LLM("google/gemini-3-flash"),
        tts=tts,
        turn_handling={
            "turn_detection": "stt",
        },
    )

    is_user_speaking = False
    is_agent_speaking = False

    @session.on("user_state_changed")
    def _on_user_state_changed(ev: UserStateChangedEvent) -> None:
        nonlocal is_user_speaking
        is_user_speaking = ev.new_state == "speaking"

    @session.on("agent_state_changed")
    def _on_agent_state_changed(ev: AgentStateChangedEvent) -> None:
        nonlocal is_agent_speaking
        is_agent_speaking = ev.new_state == "speaking"

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent) -> None:
        metrics.log_metrics(ev.metrics)

    async def log_usage() -> None:
        logger.info(f"Usage: {session.usage}")

    ctx.add_shutdown_callback(log_usage)

    @ctx.room.on("participant_attributes_changed")
    def on_participant_attributes_changed(
        changed_attributes: dict[str, str], participant: rtc.Participant
    ) -> None:
        if participant.kind != rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD:
            return

        if "voice" not in changed_attributes:
            return

        voice_id = participant.attributes.get("voice")
        logger.info(
            f"participant {participant.identity} requested voice change: {voice_id}"
        )
        if not voice_id:
            return

        voice_data = next(
            (voice for voice in cartesia_voices if voice["id"] == voice_id), None
        )

        if voice_data is not None:
            language = voice_data["language"]
        else:
            language = _LANGUAGE

        is_success = True
        try:
            tts.update_options(voice=voice_id, language=language)
        except ValueError:
            is_success = False
        try:
            stt.update_options(language=language)
        except ValueError:
            is_success = False

        if not (is_agent_speaking or is_user_speaking):
            if is_success:
                message = _get_voice_changed_message_for_language(language=language)
            else:
                message = _get_voice_change_failed_message_for_language(
                    language=language
                )
            if message is not None:
                session.say(message, allow_interruptions=True)

    await session.start(
        agent=MyAgent(language=_LANGUAGE),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
        ),
    )

    voices = sorted(
        [{"id": v["id"], "name": v["name"]} for v in cartesia_voices],
        key=lambda x: x["name"],
    )
    await ctx.room.local_participant.set_attributes({"voices": json.dumps(voices)})


if __name__ == "__main__":
    cli.run_app(server)
