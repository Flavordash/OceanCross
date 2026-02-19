import { tool } from "ai";
import { z } from "zod";
import {
  getEvents,
  createEvent,
  deleteEvent,
  checkConflicts,
  getAvailableAircraft,
  getInstructors,
  getStudents,
} from "@/lib/db/schedule";
import { getAllAircraft } from "@/lib/db/aircraft";

const checkAvailabilityParams = z.object({
  startDate: z.string().describe("Start date in ISO format (e.g. 2025-01-15)"),
  endDate: z.string().describe("End date in ISO format (e.g. 2025-01-15)"),
  eventType: z
    .enum(["flight_training", "maintenance", "exam", "ground_school"])
    .optional()
    .describe("Filter by event type"),
});

const createBookingParams = z.object({
  title: z.string().describe("Event title"),
  type: z
    .enum(["flight_training", "maintenance", "exam", "ground_school"])
    .describe("Event type"),
  date: z.string().describe("Date in ISO format (e.g. 2025-01-15)"),
  startTime: z.string().describe("Start time in HH:MM format (24hr)"),
  endTime: z.string().describe("End time in HH:MM format (24hr)"),
  aircraftId: z.string().optional().describe("Aircraft UUID"),
  instructorId: z.string().optional().describe("Instructor UUID"),
  studentId: z.string().optional().describe("Student UUID"),
});

const getMyScheduleParams = z.object({
  startDate: z
    .string()
    .optional()
    .describe("Start date ISO. Defaults to today."),
  endDate: z
    .string()
    .optional()
    .describe("End date ISO. Defaults to 7 days from now."),
});

const cancelBookingParams = z.object({
  eventId: z.string().describe("The UUID of the event to cancel"),
});

export function createTools(userId: string, userRole: string) {
  return {
    check_availability: tool({
      description:
        "Check available time slots for a given date range and event type. Returns existing bookings so the AI can identify free slots.",
      inputSchema: checkAvailabilityParams,
      execute: async (params: z.infer<typeof checkAvailabilityParams>) => {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);

        const events = await getEvents({
          start: start.toISOString(),
          end: end.toISOString(),
        });

        const filtered = params.eventType
          ? events.filter((e) => e.type === params.eventType)
          : events;

        const [aircraftList, instructors, students] = await Promise.all([
          getAvailableAircraft(),
          getInstructors(),
          getStudents(),
        ]);

        return {
          existingBookings: filtered.map((e) => ({
            title: e.title,
            type: e.type,
            start: String(e.startTime),
            end: String(e.endTime),
            aircraft: e.aircraftReg,
            instructor: e.instructorName,
            student: e.studentName,
          })),
          availableAircraft: aircraftList.map((a) => ({
            id: a.id,
            registration: a.registration,
            model: a.model,
          })),
          availableInstructors: instructors.map((i) => ({
            id: i.id,
            name: i.fullName,
          })),
          availableStudents: students.map((s) => ({
            id: s.id,
            name: s.fullName,
          })),
        };
      },
    }),

    create_booking: tool({
      description:
        "Create a new schedule booking. ALWAYS confirm details with the user before calling this.",
      inputSchema: createBookingParams,
      execute: async (params: z.infer<typeof createBookingParams>) => {
        const start = new Date(`${params.date}T${params.startTime}:00`);
        const end = new Date(`${params.date}T${params.endTime}:00`);

        const conflict = await checkConflicts(
          start.toISOString(),
          end.toISOString(),
          {
            aircraftId: params.aircraftId ?? null,
            instructorId: params.instructorId ?? null,
            studentId: params.studentId ?? null,
          }
        );

        if (conflict.hasConflict) {
          return {
            success: false as const,
            error: "Scheduling conflict detected",
            conflicts: conflict.conflicts,
          };
        }

        const event = await createEvent({
          title: params.title,
          type: params.type,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          aircraftId: params.aircraftId ?? null,
          instructorId: params.instructorId ?? null,
          studentId: params.studentId ?? null,
        });

        return {
          success: true as const,
          event: {
            id: event.id,
            title: event.title,
            type: event.type,
            start: String(event.startTime),
            end: String(event.endTime),
            status: event.status,
          },
        };
      },
    }),

    get_my_schedule: tool({
      description: "Get the current user's upcoming schedule",
      inputSchema: getMyScheduleParams,
      execute: async (params: z.infer<typeof getMyScheduleParams>) => {
        const now = new Date();
        const start = params.startDate
          ? new Date(params.startDate)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = params.endDate
          ? new Date(params.endDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const events = await getEvents({
          start: start.toISOString(),
          end: end.toISOString(),
          userId,
          role: userRole,
        });

        return {
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            type: e.type,
            start: String(e.startTime),
            end: String(e.endTime),
            status: e.status,
            aircraft: e.aircraftReg,
            instructor: e.instructorName,
            student: e.studentName,
          })),
          total: events.length,
        };
      },
    }),

    cancel_booking: tool({
      description:
        "Cancel a scheduled booking by event ID. ALWAYS confirm with the user before cancelling.",
      inputSchema: cancelBookingParams,
      execute: async (params: z.infer<typeof cancelBookingParams>) => {
        const event = await deleteEvent(params.eventId);
        if (!event) {
          return { success: false as const, error: "Event not found" };
        }
        return {
          success: true as const,
          cancelled: {
            id: event.id,
            title: event.title,
            start: String(event.startTime),
            end: String(event.endTime),
          },
        };
      },
    }),

    get_aircraft_status: tool({
      description:
        "Get the status of all aircraft in the fleet (available, in_maintenance, grounded)",
      inputSchema: z.object({}),
      execute: async () => {
        const list = await getAllAircraft();
        return {
          aircraft: list.map((a) => ({
            id: a.id,
            registration: a.registration,
            type: a.type,
            model: a.model,
            status: a.status,
            totalHours: a.totalHours,
          })),
          summary: {
            total: list.length,
            available: list.filter((a) => a.status === "available").length,
            inMaintenance: list.filter((a) => a.status === "in_maintenance")
              .length,
            grounded: list.filter((a) => a.status === "grounded").length,
          },
        };
      },
    }),
  };
}
