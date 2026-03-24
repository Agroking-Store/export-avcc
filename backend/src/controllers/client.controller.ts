import { Request, Response } from "express";
import {
  createClientService,
  getClientsService,
  getClientByIdService,
  updateClientService,
  deleteClientService,
} from "../services/client.service";
import {
  validateCreateClient,
  validateUpdateClient,
} from "../validations/client.validation";

export const createClient = async (req: Request, res: Response) => {
  try {
    validateCreateClient(req.body);
    const client = await createClientService(req.body);
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await getClientsService(req.query);
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await getClientByIdService(req.params.id as string);
    res.json(client);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    validateUpdateClient(req.body);
    const updated = await updateClientService(req.params.id as string, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    await deleteClientService(req.params.id as string);
    res.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
