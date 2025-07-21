import { Request, Response } from 'express';
import { generateAccessToken } from '../utils/generateToken';
import { cache } from '../utils/cache'
import dayjs from 'dayjs';
import { User } from '../models/user';
import { LoginHistory } from '../models/loginHistory';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const userAgent = req.headers['user-agent'] || '';

    try {
        const user = await User.findOne({ username }).select('+password');
        
        // 1. Registrar intento fallido (usuario no existe)
        if (!user) {
            await LoginHistory.create({
                userId: null,
                email: username,
                userAgent,
                success: false,
                failureReason: 'Usuario no encontrado'
            });
            return res.status(401).json({ message: "Credenciales Incorrectas" });
        }

        const isMatch = await user.comparePassword(password);
        
        // 2. Registrar contraseña incorrecta
        if (!isMatch) {
            await LoginHistory.create({
                userId: user._id.toString(),
                email: user.email,
                userAgent,
                success: false,
                failureReason: 'Contraseña incorrecta'
            });
            return res.status(401).json({ message: "Credenciales Incorrectas" });
        }

        // 3. Registrar usuario desactivado
        if (!user.status) {
            await LoginHistory.create({
                userId: user._id.toString(),
                email: user.email,
                userAgent,
                success: false,
                failureReason: 'Usuario desactivado'
            });
            return res.status(403).json({ message: "Usuario desactivado" });
        }

        // 4. Registrar login exitoso
        await LoginHistory.create({
            userId: user._id.toString(),
            email: user.email,
            userAgent,
            success: true
        });

        const accessToken = generateAccessToken(user._id.toString());
        cache.set(user._id.toString(), accessToken, 60 * 15);

        const { password: _, ...userWithoutPassword } = user.toObject();

        return res.json({
            message: "Login exitoso",
            accessToken,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const getTimeToken = (req: Request, res: Response) => {
    const { userId } = req.params;
    const ttl = cache.getTtl(userId);

    if (!ttl) {
        return res.status(404).json({ message: "Token no encontrado" });
    }

    const now = Date.now();
    const timeToLifeSecond = Math.floor((ttl - now) / 1000);
    const expTime = dayjs(ttl).format("HH:mm:ss");

    return res.json({
        timeToLifeSecond,
        expTime
    });
};

export const updateToken = (req: Request, res: Response) => {
    const { userId } = req.params;
    const ttl = cache.getTtl(userId);

    if (!ttl) {
        return res.status(404).json({ message: "Token no encontrado" });
    }

    const newTime: number = 60 * 15;
    if (typeof cache.ttl === 'function') {
        cache.ttl(userId, newTime);
    } else {
        return res.status(500).json({ message: "No se puede actualizar el TTL del token" });
    }

    return res.json({ message: "Actualizado con exito" });
};

export const getAllUser = async (_req: Request, res: Response) => {
    const userList = await User.find();
    return res.json({ userList });
};

export const getUserByUsername = async (req: Request, res: Response) => {
    const { userName } = req.params;
    const userByUsername = await User.find({ username: userName });

    if (!userByUsername || userByUsername.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({ userByUsername });
};

export const saveUser = async (req: Request, res: Response) => {
    try {
        const { name, username, email, phone, password, role } = req.body;
        const newUser = new User({
            name,
            username,
            email,
            phone,
            password,
            role,
            status: true
        });
        const user = await newUser.save();
        return res.json({ user });
    } catch (error) {
        console.log("ERROR OCURRIDO EN SAVE USER: ", error);
        return res.status(500).json({ message: "Error al guardar el usuario", error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { name, email, phone, password, role } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "El correo ya está registrado" });
            }
            user.email = email;
        }


        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.role = role || user.role;

        if (password) {
            user.password = password;
        }

        const updatedUser = await user.save();
        
    
        const { password: _, ...userResponse } = updatedUser.toObject();

        return res.json({
            message: "Usuario actualizado con éxito",
            user: userResponse
        });

    } catch (error) {
        console.error("Error en updateUser:", error);
        return res.status(500).json({
            message: "Error al actualizar el usuario",
            error: error instanceof Error ? error.message : error
        });
    }
};


export const deleteUser = async (req:Request, res:Response) => {
    const {userId} = req.params
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        user.status = false
        user.deleteDate = new Date();
        
        await user.save();
        const { password: _, ...userResponse } = user.toObject();
        return res.json({ message: "Usuario eliminado con éxito", user: userResponse });
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        return res.status(500).json({ message: "Error al eliminar el usuario", error });
    }
}